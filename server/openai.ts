import OpenAI from "openai";
import * as fs from 'fs';
import { CompleteCV } from "@shared/types";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

/**
 * Enhances text using OpenAI's GPT model
 * @param text Original text to enhance
 * @param type Type of text (summary or responsibilities)
 * @returns Enhanced professional text
 */
export async function enhanceTextWithAI(text: string, type: "summary" | "responsibilities"): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const promptMap = {
      summary: `Enhance the following professional summary to make it more impactful, professional, and concise. Maintain the key skills and experience mentioned but elevate the language: "${text}"`,
      responsibilities: `Rewrite the following job responsibilities to sound more professional, achievement-oriented, and impactful. Use strong action verbs and quantify accomplishments where possible: "${text}"`
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest model as noted in the blueprint
      messages: [
        {
          role: "system",
          content: "You are a professional CV and resume writer with expertise in creating compelling professional content."
        },
        {
          role: "user",
          content: promptMap[type]
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    return response.choices[0].message.content?.trim() || text;
  } catch (error) {
    console.error("Error enhancing text with AI:", error);
    throw new Error(`Failed to enhance text: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Analyze a PDF using OpenAI's vision model to extract CV information
 * This is specifically designed for PDFs that are difficult to extract text from
 * @param pdfPath Path to the PDF file
 * @returns Structured CV data
 */
export async function analyzePDFWithVision(pdfPath: string): Promise<CompleteCV> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Convert the PDF to a base64-encoded image
    console.log(`Reading PDF for vision analysis: ${pdfPath}`);
    
    // Use base64 encoding of the PDF directly - GPT-4o can analyze PDFs
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString('base64');
    
    console.log("PDF loaded for vision analysis, size:", pdfBuffer.length);
    
    // Create the prompt for CV analysis
    const analysisPrompt = `
You are a professional CV analyzer. I'm providing a PDF of a resume/CV.
Carefully analyze this document and extract the following information:

1. Personal information (name, email, phone, LinkedIn)
2. Professional summary/profile
3. Technical skills and soft skills
4. Work experience (with company name, job title, dates, and responsibilities)
5. Education (with institution, degree, dates)
6. Certifications (if any)
7. Languages (if any)
8. Extracurricular activities or volunteering (if any)

Format your response as a structured JSON object with these sections.
For any fields where information is unclear or missing, make a reasonable inference
but prioritize accuracy over completeness.

The response should be in this format:
{
  "personal": {
    "name": "",
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
      "current": false,
      "responsibilities": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
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
      "description": ""
    }
  ]
}`;

    console.log("Sending PDF to OpenAI Vision API...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // The newest model with vision capabilities
      messages: [
        {
          role: "system",
          content: "You are a professional CV analyzer that extracts structured information from resume documents."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`,
              }
            }
          ],
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2500,
    });

    // Process the response
    const extractedData = response.choices[0].message.content;
    if (!extractedData) {
      throw new Error("Failed to extract data from PDF. The AI model returned an empty response.");
    }

    console.log("Vision analysis complete, processing results...");
    
    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(extractedData);
    } catch (e) {
      console.error("Error parsing OpenAI JSON response:", e);
      console.log("Raw response:", extractedData);
      throw new Error("Failed to parse JSON response from OpenAI");
    }
    
    // Map to our CV structure
    return processVisionResponse(parsedData);
  } catch (error) {
    console.error("Error analyzing PDF with vision:", error);
    throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Process the vision API response into our CV data structure
 */
function processVisionResponse(response: any): CompleteCV {
  console.log("Processing vision API response...");
  
  // Create default CV structure with data from vision analysis
  const cv: CompleteCV = {
    personal: {
      firstName: extractFirstName(response),
      lastName: extractLastName(response),
      email: response.personal?.email || response.email || response.contact?.email || "",
      phone: response.personal?.phone || response.phoneNumber || response.phone || response.contact?.phone || "",
      linkedin: response.personal?.linkedin || response.linkedIn || response.contact?.linkedin || "",
    },
    professional: {
      summary: response.summary || response.professionalSummary || response.profile || response.about || "",
    },
    keyCompetencies: {
      technicalSkills: extractArray(response.skills?.technical || response.technicalSkills || response.hardSkills || []),
      softSkills: extractArray(response.skills?.soft || response.softSkills || response.personalSkills || []),
    },
    experience: (response.experience || response.workExperience || []).map((exp: any) => ({
      id: Math.random(), // Generate a temporary id
      companyName: exp.company || exp.companyName || exp.organization || "",
      jobTitle: exp.jobTitle || exp.title || exp.position || exp.role || "",
      startDate: exp.startDate || exp.start || "",
      endDate: exp.endDate || exp.end || "",
      isCurrent: exp.isCurrent || exp.current || false,
      responsibilities: Array.isArray(exp.responsibilities) 
        ? exp.responsibilities.join("\n") 
        : (exp.responsibilities || exp.description || ""),
    })),
    education: (response.education || []).map((edu: any) => ({
      id: Math.random(), // Generate a temporary id
      schoolName: edu.institution || edu.school || edu.university || edu.schoolName || "",
      major: edu.degree || edu.major || edu.qualification || edu.field || "",
      startDate: edu.startDate || edu.start || "",
      endDate: edu.endDate || edu.end || "",
      achievements: edu.achievements || edu.description || "",
    })),
    certificates: (response.certifications || response.certificates || []).map((cert: any) => ({
      id: Math.random(), // Generate a temporary id
      institution: cert.issuer || cert.institution || cert.organization || "",
      name: cert.name || cert.title || cert.certification || "",
      dateAcquired: cert.date || cert.dateAcquired || cert.issueDate || "",
      expirationDate: cert.expirationDate || cert.expiry || "",
      achievements: cert.description || cert.achievements || "",
    })),
    languages: (response.languages || []).map((lang: any) => ({
      id: Math.random(), // Generate a temporary id
      name: lang.language || lang.name || "",
      proficiency: mapLanguageProficiency(lang.proficiency || lang.level || ""),
    })),
    extracurricular: (response.extracurricular || response.activities || response.volunteering || []).map((extra: any) => ({
      id: Math.random(), // Generate a temporary id
      organization: extra.organization || extra.name || "",
      role: extra.role || extra.position || "",
      startDate: extra.startDate || extra.start || "",
      endDate: extra.endDate || extra.end || "",
      isCurrent: extra.isCurrent || extra.current || false,
      description: extra.description || "",
    })),
    additional: {
      skills: extractArray(response.additionalSkills || response.additional?.skills || []),
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
 * Extract first name from various response formats
 */
function extractFirstName(response: any): string {
  // Check for structured format
  if (response.personal?.firstName) {
    return response.personal.firstName;
  }
  if (response.personal?.first_name) {
    return response.personal.first_name;
  }
  
  // Try to split full name
  const fullName = response.personal?.name || response.name || "";
  if (fullName) {
    const parts = fullName.split(' ');
    if (parts.length > 0) {
      return parts[0];
    }
  }
  
  return "";
}

/**
 * Extract last name from various response formats
 */
function extractLastName(response: any): string {
  // Check for structured format
  if (response.personal?.lastName) {
    return response.personal.lastName;
  }
  if (response.personal?.last_name) {
    return response.personal.last_name;
  }
  
  // Try to split full name
  const fullName = response.personal?.name || response.name || "";
  if (fullName) {
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
  }
  
  return "";
}

/**
 * Ensure array values are properly extracted
 */
function extractArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(item => item.trim());
  return [];
}

/**
 * Map language proficiency to our standard format
 */
function mapLanguageProficiency(proficiency: string): "native" | "fluent" | "advanced" | "intermediate" | "basic" {
  const lowerProf = proficiency.toLowerCase();
  
  if (lowerProf.includes('native') || lowerProf.includes('mother')) {
    return "native";
  }
  if (lowerProf.includes('fluent') || lowerProf.includes('proficient') || lowerProf.includes('c2')) {
    return "fluent";
  }
  if (lowerProf.includes('advanced') || lowerProf.includes('c1') || lowerProf.includes('b2')) {
    return "advanced";
  }
  if (lowerProf.includes('intermediate') || lowerProf.includes('b1')) {
    return "intermediate";
  }
  
  return "basic";
}
