import * as fs from 'fs';
import * as mammoth from 'mammoth';
import { extractPDFText } from './mock-pdf-parse';
import OpenAI from 'openai';
import { CompleteCV } from '@shared/types';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Process a CV document (PDF or Word)
 * This function will extract text from the file and then use OpenAI to parse it
 */
export async function processCV(filePath: string, fileType: string): Promise<CompleteCV> {
  try {
    // Step 1: Extract text from the document
    let docText = "";

    // Handle Word documents - works reliably
    if (fileType.includes("wordprocessingml") || fileType.includes("msword")) {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        docText = result.value;
        console.log("Extracted Word text length:", docText.length);
      } catch (error) {
        console.error("Error extracting text from Word document:", error);
        throw new Error("Failed to extract text from Word document");
      }
    } 
    // Handle PDF documents by converting to Word first 
    else if (fileType === "application/pdf") {
      try {
        console.log("Converting PDF to Word document before extraction...");
        
        // Strategy: Convert PDF to Word using docx library
        // 1. Extract text from PDF
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await extractPDFText(dataBuffer);
        const pdfText = pdfData.text;
        console.log("Raw PDF text extraction length:", pdfText.length);
        
        // 2. Create a Word document from the extracted text
        console.log("Creating Word document from PDF text...");
        
        // Import Document, Paragraph, TextRun, and Packer from docx 
        const { Document, Paragraph, TextRun, Packer } = require("docx");
        
        // Create paragraphs from text by splitting on newlines
        const paragraphs = pdfText.split('\n').map(line => 
          new Paragraph({
            children: [new TextRun(line.trim() || ' ')] // Ensure empty lines still create paragraphs
          })
        );
        
        // Create Word document
        const doc = new Document({
          sections: [{
            properties: {},
            children: paragraphs
          }]
        });
        
        // Save to temporary file
        const os = require('os');
        const path = require('path');
        const docxFileName = path.basename(filePath, '.pdf') + '.docx';
        const docxPath = path.join(os.tmpdir(), docxFileName);
        
        // Generate document buffer
        const buffer = await Packer.toBuffer(doc);
        
        // Write Word file to disk
        fs.writeFileSync(docxPath, buffer);
        console.log(`Created Word document at ${docxPath} from PDF`);
        
        // 3. Now extract text from the Word document
        const result = await mammoth.extractRawText({path: docxPath});
        docText = result.value;
        console.log("Extracted text from converted Word document, length:", docText.length);
        
        // Clean up the temp Word file
        try {
          fs.unlinkSync(docxPath);
        } catch (unlinkError) {
          console.warn("Failed to delete temporary Word file:", unlinkError);
        }
      } catch (error) {
        console.error("Error processing PDF:", error);
        throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    // Unsupported file type
    else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Validate we got sufficient text
    if (!docText || docText.length < 100) {
      throw new Error("Could not extract sufficient text from document");
    }

    // Step 2: Truncate text if needed (OpenAI has token limits)
    const maxTextLength = 30000;
    if (docText.length > maxTextLength) {
      console.log(`Document text too long (${docText.length} chars), truncating to ${maxTextLength} chars`);
      // Keep first 10,000 chars (usually contains the most important info)
      const firstPart = docText.substring(0, 10000);
      // Keep last 5,000 chars (might contain conclusion or important ending sections)
      const lastPart = docText.substring(docText.length - 5000);
      // Take 15,000 chars from the middle (to capture work experience, etc.)
      const middleStart = Math.floor((docText.length - 15000) / 2);
      const middlePart = docText.substring(middleStart, middleStart + 15000);
      
      docText = `${firstPart}\n\n[...text truncated due to length...]\n\n${middlePart}\n\n[...text truncated due to length...]\n\n${lastPart}`;
      console.log(`Truncated text length: ${docText.length}`);
    }

    // Step 3: Use OpenAI to parse the text
    console.log("Analyzing CV content with OpenAI...");
    
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
${docText}`;

    // Step 4: Call OpenAI API
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

    // Step 5: Process response
    const extractedData = response.choices[0].message.content;
    if (!extractedData) {
      throw new Error("Failed to extract data from CV. The AI model returned an empty response.");
    }

    // Step 6: Parse the response
    console.log("Parsing OpenAI response...");
    let parsedData;
    try {
      parsedData = JSON.parse(extractedData);
    } catch (e) {
      console.error("Error parsing OpenAI JSON response:", e);
      console.log("Raw response:", extractedData);
      throw new Error("Failed to parse JSON response from OpenAI");
    }
    
    // Step 7: Map response to our CV structure
    const cv: CompleteCV = {
      personal: {
        firstName: parsedData.personal?.firstName || parsedData.personal?.first_name || parsedData.personal?.givenName || "",
        lastName: parsedData.personal?.lastName || parsedData.personal?.last_name || parsedData.personal?.surname || "",
        email: parsedData.personal?.email || parsedData.personal?.emailAddress || parsedData.contact?.email || "",
        phone: parsedData.personal?.phone || parsedData.personal?.phoneNumber || parsedData.personal?.mobile || parsedData.contact?.phone || "",
        linkedin: parsedData.personal?.linkedin || parsedData.personal?.linkedIn || parsedData.personal?.linkedInUrl || parsedData.contact?.linkedin || "",
      },
      professional: {
        summary: parsedData.summary || parsedData.professionalSummary || parsedData.profile || parsedData.bio || "",
      },
      keyCompetencies: {
        technicalSkills: parsedData.skills?.technical || parsedData.technicalSkills || parsedData.hardSkills || parsedData.keyCompetencies?.technical || [],
        softSkills: parsedData.skills?.soft || parsedData.softSkills || parsedData.personalSkills || parsedData.keyCompetencies?.soft || [],
      },
      experience: (parsedData.experience || []).map((exp: any) => ({
        id: Math.random(), // Generate a temporary id
        companyName: exp.company || exp.companyName || "",
        jobTitle: exp.jobTitle || exp.title || exp.position || "",
        startDate: exp.startDate || exp.start || "",
        endDate: exp.endDate || exp.end || "",
        isCurrent: exp.isCurrent || exp.current || false,
        responsibilities: exp.responsibilities || exp.description || "",
      })),
      education: (parsedData.education || []).map((edu: any) => ({
        id: Math.random(), // Generate a temporary id
        schoolName: edu.institution || edu.school || edu.university || edu.schoolName || "",
        major: edu.degree || edu.major || edu.fieldOfStudy || edu.field || "",
        startDate: edu.startDate || edu.start || "",
        endDate: edu.endDate || edu.end || "",
        achievements: edu.achievements || edu.description || "",
      })),
      certificates: (parsedData.certifications || []).map((cert: any) => ({
        id: Math.random(), // Generate a temporary id
        institution: cert.issuer || cert.institution || cert.organization || cert.provider || "",
        name: cert.name || cert.title || cert.certification || "",
        dateAcquired: cert.date || cert.dateAcquired || cert.issuedDate || cert.issued || "",
        expirationDate: cert.expirationDate || cert.expiry || cert.validUntil || "",
        achievements: cert.description || cert.achievements || "",
      })),
      languages: (parsedData.languages || []).map((lang: any) => ({
        id: Math.random(), // Generate a temporary id
        name: lang.language || lang.name || "",
        proficiency: mapLanguageProficiency(lang.proficiency || lang.level || ""),
      })),
      extracurricular: (parsedData.extracurricular || []).map((activity: any) => ({
        id: Math.random(), // Generate a temporary id
        organization: activity.organization || activity.club || activity.group || "",
        role: activity.role || activity.position || activity.title || "",
        startDate: activity.startDate || activity.start || "",
        endDate: activity.endDate || activity.end || "",
        isCurrent: activity.isCurrent || activity.current || false,
        description: activity.description || activity.details || activity.responsibilities || "",
      })),
      additional: {
        skills: parsedData.additionalSkills || parsedData.additional?.skills || parsedData.otherSkills || parsedData.additional || [],
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
  } catch (error) {
    console.error("Error processing CV:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to process CV: ${error.message}`);
    } else {
      throw new Error("Failed to process CV: Unknown error");
    }
  }
}

/**
 * Map language proficiency from various formats to our standard format
 * @param proficiency Language proficiency as string
 * @returns Standardized proficiency level
 */
function mapLanguageProficiency(proficiency: string): "native" | "fluent" | "advanced" | "intermediate" | "basic" {
  const proficiencyLower = (proficiency || "").toLowerCase();
  
  if (proficiencyLower.includes("native") || proficiencyLower.includes("mother tongue")) {
    return "native";
  } else if (proficiencyLower.includes("fluent") || proficiencyLower.includes("fluency") || proficiencyLower.includes("c2")) {
    return "fluent";
  } else if (proficiencyLower.includes("advanced") || proficiencyLower.includes("proficient") || proficiencyLower.includes("c1")) {
    return "advanced";
  } else if (proficiencyLower.includes("intermediate") || proficiencyLower.includes("b1") || proficiencyLower.includes("b2")) {
    return "intermediate";
  } else {
    return "basic";
  }
}