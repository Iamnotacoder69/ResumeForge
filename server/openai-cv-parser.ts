import OpenAI from "openai";
import { CompleteCV } from "@shared/types";
import * as fs from "fs";
import * as mammoth from "mammoth";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to read file content
async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  try {
    let text = "";
    
    if (fileType === "application/pdf") {
      // For PDF files, we'll send the raw content to OpenAI
      // Since OpenAI can handle PDFs directly, we don't need to extract text here
      // Instead, we'll let the AI do a best-effort extraction
      text = "[This is PDF content that will be processed directly by the AI]";
    } else if (fileType.includes("wordprocessingml") || fileType.includes("msword")) {
      // Parse Word document
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({buffer: dataBuffer});
      text = result.value;
    } else {
      throw new Error("Unsupported file type");
    }
    
    return text;
  } catch (error: unknown) {
    console.error("Error extracting text from file:", error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from file: ${error.message}`);
    } else {
      throw new Error("Failed to extract text from file");
    }
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
    // For demo purposes, let's create a sample CV structure
    // In a real implementation, we would use OpenAI's API to extract information from the CV
    // For now, we'll provide a sample response to demonstrate the functionality
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    // This would be replaced with actual OpenAI API call in production
    const sampleCVData = {
      personal: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        linkedin: "linkedin.com/in/johndoe"
      },
      summary: "Experienced software developer with 8+ years in full-stack development, specializing in React, Node.js, and cloud technologies. Passionate about creating scalable and user-friendly applications.",
      skills: {
        technical: ["JavaScript", "TypeScript", "React", "Node.js", "Express", "AWS", "Docker", "MongoDB", "PostgreSQL"],
        soft: ["Leadership", "Communication", "Problem Solving", "Team Collaboration", "Project Management"]
      },
      experience: [
        {
          company: "Tech Innovations Inc.",
          jobTitle: "Senior Software Engineer",
          startDate: "2020-03",
          endDate: "",
          isCurrent: true,
          responsibilities: "Lead development of enterprise web applications. Mentor junior developers. Implement CI/CD pipelines. Design and architect new features."
        },
        {
          company: "Digital Solutions LLC",
          jobTitle: "Full Stack Developer",
          startDate: "2017-06",
          endDate: "2020-02",
          isCurrent: false,
          responsibilities: "Developed responsive web applications using React. Created RESTful APIs with Node.js and Express. Optimized database queries in PostgreSQL."
        },
        {
          company: "WebTech Systems",
          jobTitle: "Frontend Developer",
          startDate: "2015-09",
          endDate: "2017-05",
          isCurrent: false,
          responsibilities: "Built interactive user interfaces with JavaScript and React. Implemented responsive designs and ensured cross-browser compatibility."
        }
      ],
      education: [
        {
          institution: "University of Technology",
          degree: "Master of Computer Science",
          startDate: "2013-09",
          endDate: "2015-05",
          achievements: "Graduated with distinction. Research focus on distributed systems."
        },
        {
          institution: "State University",
          degree: "Bachelor of Science in Computer Engineering",
          startDate: "2009-09",
          endDate: "2013-05",
          achievements: "Dean's List all semesters. Participated in ACM programming competitions."
        }
      ],
      certifications: [
        {
          issuer: "AWS",
          name: "AWS Certified Solutions Architect",
          date: "2021-04",
          expirationDate: "2024-04",
          description: "Professional level certification for designing distributed systems on AWS."
        },
        {
          issuer: "MongoDB",
          name: "MongoDB Certified Developer",
          date: "2019-11",
          expirationDate: "",
          description: "Expert-level knowledge of MongoDB development and optimization."
        }
      ],
      languages: [
        {
          language: "English",
          proficiency: "native"
        },
        {
          language: "Spanish",
          proficiency: "intermediate"
        },
        {
          language: "French",
          proficiency: "basic"
        }
      ],
      extracurricular: [
        {
          organization: "Tech Mentorship Program",
          role: "Volunteer Mentor",
          startDate: "2019-01",
          endDate: "",
          isCurrent: true,
          description: "Provide guidance to underrepresented groups in tech. Conduct monthly coding workshops."
        }
      ],
      additionalSkills: ["Public Speaking", "Technical Writing", "Agile Methodologies"]
    };
    
    // Map the result to CompleteCV structure
    const cv: CompleteCV = mapResponseToCV(sampleCVData);
    
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