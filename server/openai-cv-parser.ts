import OpenAI from "openai";
import { CompleteCV } from "@shared/types";
import * as fs from "fs";
import * as mammoth from "mammoth";
import { parsePDF } from "./pdf-wrapper";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function for extracting text from PDF files
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await parsePDF(dataBuffer);
    console.log(`Extracted PDF text length: ${pdfData.text.length}`);
    
    // If the extracted text is very short, it might be a scanned PDF
    if (pdfData.text.length < 100) {
      console.log("PDF text extraction yielded very little text. Might be a scanned PDF.");
      return "This appears to be a scanned PDF with limited extractable text. Please provide a searchable PDF for better results.";
    }
    
    // Return the extracted text
    return pdfData.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "Error extracting text from PDF. The document may be corrupted or password-protected.";
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
        const dataBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({buffer: dataBuffer});
        cvText = result.value;
        console.log("Extracted Word text length:", cvText.length);
        
        if (cvText.length < 100) {
          console.log("Warning: Very little text extracted from Word document");
          cvText += "\n\nNote: Very little text was extracted from this document. It may not contain searchable text or might be mostly formatted as images.";
        }
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
          cvText = pdfText;
          console.log("Successfully extracted text from PDF, length:", pdfText.length);
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
    
    const jsonStructurePrompt = `
You are a professional CV parser. Extract the following structured information from this CV, keeping dates in YYYY-MM format when possible:

1. Personal information (name, email, phone, LinkedIn profile)
2. Professional summary
3. Technical and soft skills
4. Work experience (including company, job title, dates, current status, and responsibilities)
5. Education (institution, degree, dates, and achievements)
6. Certifications (name, issuer, date, expiration date if any)
7. Languages (with proficiency levels)
8. Extracurricular activities (organization, role, dates, description)
9. Any additional skills not covered above

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

Here is the CV content:
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
      firstName: response.personal?.firstName || "",
      lastName: response.personal?.lastName || "",
      email: response.personal?.email || "",
      phone: response.personal?.phone || "",
      linkedin: response.personal?.linkedin || "",
    },
    professional: {
      summary: response.summary || "",
    },
    keyCompetencies: {
      technicalSkills: response.skills?.technical || [],
      softSkills: response.skills?.soft || [],
    },
    experience: (response.experience || []).map((exp: any) => ({
      id: Math.random(), // Generate a temporary id
      companyName: exp.company || "",
      jobTitle: exp.jobTitle || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      isCurrent: exp.isCurrent || false,
      responsibilities: exp.responsibilities || "",
    })),
    education: (response.education || []).map((edu: any) => ({
      id: Math.random(), // Generate a temporary id
      schoolName: edu.institution || "",
      major: edu.degree || "",
      startDate: edu.startDate || "",
      endDate: edu.endDate || "",
      achievements: edu.achievements || "",
    })),
    certificates: (response.certifications || []).map((cert: any) => ({
      id: Math.random(), // Generate a temporary id
      institution: cert.issuer || "",
      name: cert.name || "",
      dateAcquired: cert.date || "",
      expirationDate: cert.expirationDate || "",
      achievements: cert.description || "",
    })),
    languages: (response.languages || []).map((lang: any) => ({
      id: Math.random(), // Generate a temporary id
      name: lang.language || "",
      proficiency: mapLanguageProficiency(lang.proficiency || ""),
    })),
    extracurricular: (response.extracurricular || []).map((activity: any) => ({
      id: Math.random(), // Generate a temporary id
      organization: activity.organization || "",
      role: activity.role || "",
      startDate: activity.startDate || "",
      endDate: activity.endDate || "",
      isCurrent: activity.isCurrent || false,
      description: activity.description || "",
    })),
    additional: {
      skills: response.additionalSkills || [],
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