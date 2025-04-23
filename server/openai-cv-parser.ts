import OpenAI from "openai";
import { CompleteCV } from "@shared/types";
import * as fs from "fs";
import { convertToDocx, extractTextFromDocx, extractTextFromPDF } from "./converter";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Parse CV content using OpenAI API to extract structured information
 * This updated version first converts any input file to DOCX format
 * @param filePath Path to the uploaded file
 * @param fileType MIME type of the file
 * @returns Structured CV data
 */
export async function parseCV(filePath: string, fileType: string): Promise<CompleteCV> {
  try {
    let cvText = '';
    
    // Convert the file to DOCX if it's not already
    console.log(`Processing file of type: ${fileType}`);
    const docxPath = await convertToDocx(filePath, fileType);
    console.log(`File converted/prepared at: ${docxPath}`);
    
    // Extract text based on file type
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extract text from DOCX
      cvText = await extractTextFromDocx(docxPath);
      console.log(`Extracted DOCX text length: ${cvText.length}`);
    } else if (fileType === 'application/pdf') {
      // Extract text from PDF using our PDF parser
      cvText = await extractTextFromPDF(docxPath);
      console.log(`Extracted PDF text length: ${cvText.length}`);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Trim if needed to fit within token limits
    const maxTextLength = 30000;
    if (cvText.length > maxTextLength) {
      console.log(`Text too long (${cvText.length} chars), trimming to ${maxTextLength} chars`);
      // Keep first 15,000 chars (usually contains the most important info)
      const firstPart = cvText.substring(0, 15000);
      // Keep last 15,000 chars (might contain important details)
      const lastPart = cvText.substring(cvText.length - 15000);
      cvText = `${firstPart}\n\n[...text truncated due to length...]\n\n${lastPart}`;
    }
    
    console.log("Analyzing CV content with OpenAI...");
    
    const jsonStructurePrompt = `
You are a professional CV parser specializing in extracting structured information from CVs and resumes.

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
    fs.unlinkSync(docxPath);
    
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