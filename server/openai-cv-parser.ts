import OpenAI from "openai";
import { CompleteCV } from "@shared/types";
import * as fs from "fs";
import * as mammoth from "mammoth";
import { extractPDFText } from "./mock-pdf-parse";
import AdmZip from "adm-zip";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Enhanced text extraction from Word document with fallback mechanisms
 * This is specifically designed to handle DOCX files converted from PDFs
 * which often don't extract well with standard methods
 */
async function extractDetailedTextFromWord(filePath: string): Promise<string> {
  try {
    // First try standard extraction
    const standardResult = await mammoth.extractRawText({path: filePath});
    let text = standardResult.value;
    
    console.log("Extracted Word text length:", text.length);
    
    // If we got enough text, just return it
    if (text.length > 500) {
      return text;
    }
    
    // If the text is too short, try a more aggressive approach
    console.log("Standard extraction yielded minimal text, trying alternate methods...");
    
    // Try to extract all text from all XML parts in the DOCX (which is just a ZIP file)
    try {
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();
      
      let allXmlContent = "";
      
      // Look at all XML files in the document
      zipEntries.forEach((entry) => {
        if (entry.entryName.endsWith('.xml') && !entry.isDirectory) {
          try {
            const content = zip.readAsText(entry);
            
            // Simple XML cleaning to extract just the text
            let cleaned = content
              .replace(/<\/w:t>/g, ' ')           // Add spaces between text elements
              .replace(/<[^>]*>/g, '')            // Remove all XML tags
              .replace(/\s+/g, ' ')               // Normalize whitespace
              .trim();                            // Trim extra whitespace
              
            if (cleaned.length > 20) {  // Only add content with meaningful text
              allXmlContent += cleaned + "\n\n";
            }
          } catch (e) {
            // Skip files that can't be read as text
          }
        }
      });
      
      // If we got some useful content from the XMLs
      if (allXmlContent.length > text.length) {
        console.log("XML extraction successful, got", allXmlContent.length, "characters");
        text = allXmlContent;
      }
    } catch (zipError) {
      console.error("Failed alternate DOCX extraction:", zipError);
      // Continue with standard text
    }
    
    // If still not much text, add a warning
    if (text.length < 100) {
      console.log("Warning: Very little text extracted from Word document");
      text += "\n\nNote: Very little text was extracted from this document. It may not contain searchable text or might be mostly formatted as images.";
    }
    
    return text;
  } catch (error) {
    console.error("Error extracting text from Word document:", error);
    throw error;
  }
}

// Helper function for extracting text from PDF files
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Use our custom PDF text extraction
    const pdfData = await extractPDFText(dataBuffer);
    console.log(`Extracted PDF text length: ${pdfData.text.length}`);
    
    // If we got a reasonable amount of text, use it
    if (pdfData.text.length > 300) {
      // Successful extraction
      return pdfData.text;
    }
    
    // For PDFs with minimal extractable text, let's use a fallback approach
    // Get the filename to use as context
    const fileName = pdfPath.split('/').pop() || 'document.pdf';
    
    console.log("PDF text extraction yielded minimal results, using filename as context");
    
    // Instead of extracting nothing, we'll generate a request for OpenAI to infer
    // the type of document from the file name and what little text we extracted
    return `This is a CV/resume PDF document named "${fileName}". 
The PDF appears to contain limited machine-readable text, but is likely a professional resume/CV.
From the document, I was able to extract the following text fragments:

${pdfData.text}

Please analyze this as a CV and extract all available information about the candidate,
making reasonable assumptions when specific details aren't clear.`;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "Error extracting text from PDF. Please try uploading a different file format.";
  }
}



/**
 * Parse CV content using OpenAI API to extract structured information
 * @param filePath Path to the uploaded file
 * @param fileType MIME type of the file
 * @returns Structured CV data
 */
export async function parseCV(filePath: string, fileType: string): Promise<CompleteCV> {
  try {
    // Default message for unsupported formats
    let cvText = "Please analyze this CV document and extract all relevant information.";
    
    // For Word documents, extract the text
    if (fileType.includes("wordprocessingml") || fileType.includes("msword")) {
      try {
        cvText = await extractDetailedTextFromWord(filePath);
      } catch (error) {
        console.error("Error extracting text from Word document:", error);
        cvText = "Error extracting text from Word document. Please try uploading a different file.";
      }
    }
    
    console.log("Analyzing CV content with OpenAI...");
    
    // For PDFs, let's extract the text using our PDF parser
    if (fileType === "application/pdf") {
      try {
        // Extract text from PDF
        const pdfText = await extractTextFromPDF(filePath);
        
        // If we got a reasonable amount of text, use it
        if (pdfText.length > 200) {
          // Truncate the text to prevent token limit issues
          // The OpenAI API has a token limit of ~30,000 tokens
          // A safe text length is around 30,000 characters (approximately 7,500 tokens)
          const maxTextLength = 30000;
          if (pdfText.length > maxTextLength) {
            console.log(`PDF text too long (${pdfText.length} chars), truncating to ${maxTextLength} chars`);
            // Keep first 10,000 chars (usually contains the most important info)
            const firstPart = pdfText.substring(0, 10000);
            // Keep last 5,000 chars (might contain conclusion or important ending sections)
            const lastPart = pdfText.substring(pdfText.length - 5000);
            // Take 15,000 chars from the middle (to capture work experience, etc.)
            const middleStart = Math.floor((pdfText.length - 15000) / 2);
            const middlePart = pdfText.substring(middleStart, middleStart + 15000);
            
            cvText = `${firstPart}\n\n[...text truncated due to length...]\n\n${middlePart}\n\n[...text truncated due to length...]\n\n${lastPart}`;
          } else {
            cvText = pdfText;
          }
          console.log("Successfully extracted text from PDF, processed length:", cvText.length);
        } else {
          // Otherwise, provide an error message
          console.log("PDF extraction failed or returned minimal text");
          cvText = "PDF text extraction failed or returned minimal text. This may be a scanned PDF or image-based document. Please upload a text-based PDF or a Word document for better results.";
        }
      } catch (error) {
        console.error("Error parsing PDF:", error);
        cvText = "Error parsing PDF. Please try uploading a different file format.";
      }
    }
    
    // Check if it's a PDF and note that in the prompt
    const isPDF = fileType === "application/pdf";
    
    const jsonStructurePrompt = `
You are a professional CV parser specializing in extracting structured information from CVs and resumes. ${isPDF ? "This CV was uploaded as a PDF, so you may need to infer some details from partial information." : ""}

Please analyze the CV content carefully and extract ALL of the following information, making reasonable inferences even when information is incomplete:

1. Personal information (name, email, phone, LinkedIn profile)
2. Professional summary - provide a concise summary of the person's background and experience
3. Technical and soft skills - identify both technical skills (programming languages, tools, etc.) and soft skills (leadership, communication, etc.)
4. Work experience - extract ALL work experiences including company, job title, dates, and detailed responsibilities
5. Education - extract ALL education entries including institution, degree, dates, and achievements
6. Certifications - extract ALL certifications including name, issuer, and dates
7. Languages - identify ALL languages with proficiency levels
8. Extracurricular activities - identify any activities outside of work
9. Any additional skills not covered above

NOTE: For PDF files, the text may be truncated. Make reasonable assumptions about the person's experience based on the available context. If you identify a section heading that appears cut off, try to infer what might be contained in that section.

Format your response as a JSON object with the following structure:
{
  "personal": {
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "linkedin": ""
  },
  "summary": "",
  "skills": {
    "technical": [],
    "soft": []
  },
  "experience": [
    {
      "company": "",
      "jobTitle": "",
      "startDate": "",
      "endDate": "",
      "isCurrent": boolean,
      "responsibilities": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "startDate": "",
      "endDate": "",
      "achievements": ""
    }
  ],
  "certifications": [
    {
      "issuer": "",
      "name": "",
      "date": "",
      "expirationDate": "",
      "description": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ],
  "extracurricular": [
    {
      "organization": "",
      "role": "",
      "startDate": "",
      "endDate": "",
      "isCurrent": boolean,
      "description": ""
    }
  ],
  "additionalSkills": []
}

IMPORTANT: For section content like work experiences, NEVER leave fields empty. If details are unclear, make reasonable inferences based on other parts of the CV. For example, if a job title is mentioned but not the company, try to determine the company from context.

CV content:
${cvText}`;

    // Use OpenAI to parse the CV
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the newest model
      messages: [
        {
          role: "system",
          content: "You are a professional CV parser that extracts structured information from resumes and CVs."
        },
        {
          role: "user",
          content: jsonStructurePrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2500,
    });

    const extractedData = response.choices[0].message.content;
    if (!extractedData) {
      throw new Error("Failed to extract data from CV. The AI model returned an empty response.");
    }

    // Parse the response
    console.log("Parsing OpenAI response...");
    let parsedData;
    try {
      parsedData = JSON.parse(extractedData);
    } catch (e) {
      console.error("Error parsing OpenAI JSON response:", e);
      console.log("Raw response:", extractedData);
      throw new Error("Failed to parse JSON response from OpenAI");
    }
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    // Map the OpenAI response to our CompleteCV structure
    const cv: CompleteCV = mapResponseToCV(parsedData);
    
    return cv;
  } catch (error: unknown) {
    console.error("Error parsing CV:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to parse CV: ${error.message}`);
    } else {
      throw new Error("Failed to parse CV: Unknown error");
    }
  }
}

/**
 * Map the response from OpenAI to our CompleteCV structure
 * @param response Parsed response from OpenAI
 * @returns CV data in the required format
 */
function mapResponseToCV(response: any): CompleteCV {
  // Create default CV structure
  const cv: CompleteCV = {
    personal: {
      firstName: response.personal?.firstName || response.personal?.first_name || response.personal?.givenName || "",
      lastName: response.personal?.lastName || response.personal?.last_name || response.personal?.surname || "",
      email: response.personal?.email || response.personal?.emailAddress || response.contact?.email || "",
      phone: response.personal?.phone || response.personal?.phoneNumber || response.personal?.mobile || response.contact?.phone || "",
      linkedin: response.personal?.linkedin || response.personal?.linkedIn || response.personal?.linkedInUrl || response.contact?.linkedin || "",
    },
    professional: {
      summary: response.summary || response.professionalSummary || response.profile || response.bio || "",
    },
    keyCompetencies: {
      technicalSkills: response.skills?.technical || response.technicalSkills || response.hardSkills || response.keyCompetencies?.technical || [],
      softSkills: response.skills?.soft || response.softSkills || response.personalSkills || response.keyCompetencies?.soft || [],
    },
    experience: (response.experience || []).map((exp: any) => ({
      id: Math.random(), // Generate a temporary id
      companyName: exp.company || exp.companyName || "",
      jobTitle: exp.jobTitle || exp.title || exp.position || "",
      startDate: exp.startDate || exp.start || "",
      endDate: exp.endDate || exp.end || "",
      isCurrent: exp.isCurrent || exp.current || false,
      responsibilities: exp.responsibilities || exp.description || "",
    })),
    education: (response.education || []).map((edu: any) => ({
      id: Math.random(), // Generate a temporary id
      schoolName: edu.institution || edu.school || edu.university || edu.schoolName || "",
      major: edu.degree || edu.major || edu.fieldOfStudy || edu.field || "",
      startDate: edu.startDate || edu.start || "",
      endDate: edu.endDate || edu.end || "",
      achievements: edu.achievements || edu.description || "",
    })),
    certificates: (response.certifications || []).map((cert: any) => ({
      id: Math.random(), // Generate a temporary id
      institution: cert.issuer || cert.institution || cert.organization || cert.provider || "",
      name: cert.name || cert.title || cert.certification || "",
      dateAcquired: cert.date || cert.dateAcquired || cert.issuedDate || cert.issued || "",
      expirationDate: cert.expirationDate || cert.expiry || cert.validUntil || "",
      achievements: cert.description || cert.achievements || "",
    })),
    languages: (response.languages || []).map((lang: any) => ({
      id: Math.random(), // Generate a temporary id
      name: lang.language || lang.name || "",
      proficiency: mapLanguageProficiency(lang.proficiency || lang.level || ""),
    })),
    extracurricular: (response.extracurricular || []).map((activity: any) => ({
      id: Math.random(), // Generate a temporary id
      organization: activity.organization || activity.club || activity.group || "",
      role: activity.role || activity.position || activity.title || "",
      startDate: activity.startDate || activity.start || "",
      endDate: activity.endDate || activity.end || "",
      isCurrent: activity.isCurrent || activity.current || false,
      description: activity.description || activity.details || activity.responsibilities || "",
    })),
    additional: {
      skills: response.additionalSkills || response.additional?.skills || response.otherSkills || response.additional || [],
    },
    templateSettings: {
      template: "professional",
      includePhoto: false,
      sectionOrder: [
        { id: 'summary', name: 'Professional Summary', visible: true, order: 0 },
        { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 1 },
        { id: 'experience', name: 'Work Experience', visible: true, order: 2 },
        { id: 'education', name: 'Education', visible: true, order: 3 },
        { id: 'certificates', name: 'Certificates', visible: true, order: 4 },
        { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 5 },
        { id: 'additional', name: 'Additional Information', visible: true, order: 6 },
      ],
    },
  };
  
  return cv;
}

/**
 * Map language proficiency from various formats to our standard format
 * @param proficiency Language proficiency as string
 * @returns Standardized proficiency level
 */
function mapLanguageProficiency(proficiency: string): "native" | "fluent" | "advanced" | "intermediate" | "basic" {
  proficiency = proficiency.toLowerCase();
  
  if (proficiency.includes("native") || proficiency.includes("mother tongue")) {
    return "native";
  } else if (proficiency.includes("fluent") || proficiency.includes("fluency") || proficiency.includes("c2")) {
    return "fluent";
  } else if (proficiency.includes("advanced") || proficiency.includes("proficient") || proficiency.includes("c1")) {
    return "advanced";
  } else if (proficiency.includes("intermediate") || proficiency.includes("b1") || proficiency.includes("b2")) {
    return "intermediate";
  } else {
    return "basic";
  }
}