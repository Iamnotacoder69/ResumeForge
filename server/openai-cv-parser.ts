import OpenAI from "openai";
import { CompleteCV } from "@shared/types";
import * as fs from "fs";
import * as path from "path";
import * as mammoth from "mammoth";
import { convertPDFtoTXT, convertDOCXtoTXT } from "./pdf-to-docx";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Clean up temporary files that may have been created during processing
 * @param filePaths List of file paths to clean up
 */
async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temporary file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error cleaning up temp file ${filePath}:`, error);
    }
  }
}

/**
 * Formats text for OpenAI processing with appropriate length limits
 * @param text Raw text to format
 * @param maxLength Maximum length allowed for the text
 * @returns Formatted text with appropriate length
 */
function formatTextForOpenAI(text: string, maxLength: number = 15000): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  console.log(`Text is too large (${text.length} chars), truncating to ~${maxLength} chars`);
  
  // Extract the most important parts: beginning, middle, and end
  const beginLength = Math.floor(maxLength * 0.4); // 40% for the beginning (contact, summary)
  const endLength = Math.floor(maxLength * 0.2);   // 20% for the end (education, additional info)
  const middleLength = maxLength - beginLength - endLength; // 40% for the middle (experience)
  
  const beginning = text.substring(0, beginLength);
  const end = text.substring(text.length - endLength);
  
  // Take a section from 1/3 of the way in (likely to have work experience)
  const middleStart = Math.floor(text.length / 3);
  const middle = text.substring(middleStart, middleStart + middleLength);
  
  // Combine with markers
  return `${beginning}\n\n[...content truncated due to length...]\n\n${middle}\n\n[...content truncated due to length...]\n\n${end}`;
}

/**
 * Simple utility function to read text from a file
 * @param filePath Path to the text file
 * @returns Content of the text file
 */
async function readTextFile(filePath: string): Promise<string> {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return text;
  } catch (error) {
    console.error(`Error reading text file ${filePath}:`, error);
    return "";
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
    
    console.log(`Processing CV file: ${path.basename(filePath)}, type: ${fileType}`);
    
    // For Word documents, convert to TXT and extract the text
    if (fileType.includes("wordprocessingml") || fileType.includes("msword")) {
      try {
        // Convert DOCX to TXT for consistent processing
        console.log("Converting DOCX to TXT format for text extraction");
        const txtPath = await convertDOCXtoTXT(filePath);
        
        // Read the text from the converted file
        const extractedText = fs.readFileSync(txtPath, 'utf8');
        
        // Log a preview of the extracted text
        const textPreview = extractedText.substring(0, 500).replace(/\n/g, ' ');
        console.log(`Extracted text preview from DOCX (first 500 chars): ${textPreview}...`);
        
        if (extractedText.length > 0) {
          cvText = extractedText;
          console.log(`Successfully extracted ${extractedText.length} characters from DOCX (via TXT)`);
          
          // If we got very little text, add a warning note
          if (extractedText.length < 100) {
            console.log("Warning: Very little text extracted from Word document");
            cvText += "\n\nNote: Very little text was extracted from this document. It may not contain searchable text or might be mostly formatted as images.";
          }
        } else {
          console.error("Failed to extract text from DOCX file");
          cvText = "Error extracting text from Word document. Please try uploading a different file.";
        }
      } catch (error) {
        console.error("Error processing DOCX file:", error);
        cvText = "Error extracting text from Word document. Please try uploading a different file.";
      }
    }
    
    console.log("Analyzing CV content with OpenAI...");
    
    // For PDFs, convert to TXT and extract the text
    if (fileType === "application/pdf") {
      try {
        console.log("Converting PDF to TXT format for text extraction");
        const txtPath = await convertPDFtoTXT(filePath);
        
        // Read the text from the converted file
        const extractedText = fs.readFileSync(txtPath, 'utf8');
        
        if (extractedText.length > 200) {
          // Truncate the text to prevent token limit issues
          // The OpenAI API has a token limit of ~30,000 tokens
          // A safe text length is around 30,000 characters (approximately 7,500 tokens)
          const maxTextLength = 30000;
          if (extractedText.length > maxTextLength) {
            console.log(`PDF text too long (${extractedText.length} chars), truncating to ~${maxTextLength} chars`);
            // Keep first 10,000 chars (usually contains the most important info)
            const firstPart = extractedText.substring(0, 10000);
            // Keep last 5,000 chars (might contain conclusion or important ending sections)
            const lastPart = extractedText.substring(extractedText.length - 5000);
            // Take 15,000 chars from the middle (to capture work experience, etc.)
            const middleStart = Math.floor((extractedText.length - 15000) / 2);
            const middlePart = extractedText.substring(middleStart, middleStart + 15000);
            
            cvText = `${firstPart}\n\n[...text truncated due to length...]\n\n${middlePart}\n\n[...text truncated due to length...]\n\n${lastPart}`;
          } else {
            cvText = extractedText;
          }
          console.log("Successfully extracted text from PDF, processed length:", cvText.length);
        } else {
          // We got minimal text from the PDF
          console.log("PDF extraction returned minimal text, likely a scanned document");
          
          // Add context about the file for the AI
          const fileName = path.basename(filePath);
          cvText = `This appears to be a CV document from a PDF named ${fileName}. 
The PDF may be an image-based or scanned document with limited machine-readable text.
From the document, I was able to extract the following text fragments:

${extractedText}

Please extract any information that can be determined from the available text fragments.`;
        }
      } catch (error) {
        console.error("Error converting PDF to TXT:", error);
        cvText = "Error parsing PDF. Please try uploading a different file format.";
      }
    }
    
    // Check if it's a PDF and note that in the prompt
    const isPDF = fileType === "application/pdf";
    
    // Use our utility function to format text for OpenAI with appropriate length limits
    if (cvText.length > 15000) {
      cvText = formatTextForOpenAI(cvText, 15000);
    }
    
    const jsonStructurePrompt = `
You are a professional CV parser specializing in extracting structured information from CVs and resumes. ${isPDF ? "This CV was uploaded as a PDF, and the text has been pre-processed to identify key sections." : ""}

TASK: I need you to carefully analyze the CV content provided and extract ALL structured information, making reasonable inferences when information is incomplete or ambiguous.

PAY SPECIAL ATTENTION TO:
1. Personal information - Find the person's name, contact details (email, phone), and LinkedIn profile if available
2. Professional summary - Extract or generate a concise professional summary
3. Skills - Separate technical skills (like programming languages, tools) from soft skills (leadership, communication)
4. Work experience - Identify ALL job positions with company names, titles, dates, and responsibilities
5. Education - Extract ALL education with institution names, degrees, dates
6. Certifications - Find any professional certifications with issuing organizations and dates
7. Languages - Note any languages mentioned with their proficiency levels
8. Other activities - Identify extracurricular or volunteer activities

IMPORTANT INSTRUCTIONS:
- The CV text may contain section markers like "### WORK EXPERIENCE ###" to help you identify content
- If you see "[...content truncated due to length...]", make reasonable assumptions about the missing content
- If specific dates or details are unclear, use your best judgment to infer reasonable values
- NEVER leave important fields empty - provide reasonable values based on context
- If personal information fields like name or email cannot be found, look throughout the entire text

RESPONSE FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "personal": {
    "firstName": "First name here",
    "lastName": "Last name here",
    "email": "email@example.com",
    "phone": "Phone number here",
    "linkedin": "LinkedIn URL or username"
  },
  "summary": "Professional summary text",
  "skills": {
    "technical": ["Technical skill 1", "Technical skill 2"],
    "soft": ["Soft skill 1", "Soft skill 2"]
  },
  "experience": [
    {
      "company": "Company name",
      "jobTitle": "Job title",
      "startDate": "Start date (MM/YYYY or YYYY)",
      "endDate": "End date or Present",
      "isCurrent": true/false,
      "responsibilities": "Job responsibilities and achievements"
    }
  ],
  "education": [
    {
      "institution": "School/University name",
      "degree": "Degree and field of study",
      "startDate": "Start date (YYYY)",
      "endDate": "End date (YYYY)",
      "achievements": "Any achievements or activities"
    }
  ],
  "certifications": [
    {
      "issuer": "Issuing organization",
      "name": "Certification name",
      "date": "Date obtained (YYYY or MM/YYYY)",
      "expirationDate": "Expiration date if applicable",
      "description": "Description if available"
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "Proficiency level (native/fluent/advanced/intermediate/basic)"
    }
  ],
  "extracurricular": [
    {
      "organization": "Organization name",
      "role": "Role or position",
      "startDate": "Start date",
      "endDate": "End date or Present",
      "isCurrent": true/false,
      "description": "Description of activities"
    }
  ],
  "additionalSkills": ["Other skill 1", "Other skill 2"]
}

CV CONTENT:
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
      temperature: 0.2, // Lower temperature for more factual extraction
      max_tokens: 2000, // Increased to allow more detailed extraction
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
      console.log("OpenAI CV parsing results:", {
        name: `${parsedData.personal?.firstName || ""} ${parsedData.personal?.lastName || ""}`,
        email: parsedData.personal?.email || "",
        skills: {
          technical: parsedData.skills?.technical?.length || 0,
          soft: parsedData.skills?.soft?.length || 0
        },
        experience: parsedData.experience?.length || 0,
        education: parsedData.education?.length || 0
      });
    } catch (e) {
      console.error("Error parsing OpenAI JSON response:", e);
      console.log("Raw response:", extractedData);
      throw new Error("Failed to parse JSON response from OpenAI");
    }
    
    // Map the OpenAI response to our CompleteCV structure
    const cv: CompleteCV = mapResponseToCV(parsedData);
    
    // Clean up temporary files
    try {
      // Clean up the original uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up original file: ${filePath}`);
      }
      
      // Also clean up any TXT files in the temp directory that may have been created
      const tempDir = path.join(process.cwd(), 'temp');
      const tempFiles = fs.readdirSync(tempDir);
      for (const file of tempFiles) {
        if (file.endsWith('.txt') && fs.statSync(path.join(tempDir, file)).mtime.getTime() > Date.now() - 300000) { // Files created in last 5 minutes
          fs.unlinkSync(path.join(tempDir, file));
          console.log(`Cleaned up temporary file: ${file}`);
        }
      }
    } catch (error) {
      console.error("Error cleaning up temporary files:", error);
      // Continue execution even if cleanup fails
    }
    
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