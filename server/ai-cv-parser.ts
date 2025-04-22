import OpenAI from "openai";
import { CompleteCV } from "../shared/types";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const AI_MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Parse CV using OpenAI's API for more accurate extraction
 * @param text CV content as text
 * @returns Structured CV data
 */
export async function parseWithAI(text: string): Promise<Partial<CompleteCV>> {
  try {
    console.log("Parsing CV with OpenAI...");
    
    // Create a system prompt that instructs the model how to extract information
    const systemPrompt = `
You are an expert CV/Resume parser. Extract structured information from the provided CV.
Your task is to extract the following information in a structured JSON format:

1. Personal Information (full name, email, phone, LinkedIn)
2. Professional Summary
3. Technical Skills and Soft Skills
4. Work Experience (with company names, job titles, dates, and responsibilities)
5. Education details (schools, degrees, dates)
6. Certifications
7. Languages
8. Extracurricular activities

Follow these guidelines:
- Be comprehensive and accurate
- Preserve dates in the original format when possible
- Extract as much relevant information as you can find
- When information isn't available, leave it as an empty string or array
- Return ONLY the JSON output without any explanations or commentary
- Make sure all experience entries include company name, job title, dates, and responsibilities
- Format the output to match the specified JSON structure exactly
`;
    
    // User message with CV text
    const userMessage = `Here is the CV to parse:\n\n${text}`;
    
    // Call OpenAI API to extract information
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Lower temperature for more consistent output
    });
    
    // Parse the response
    console.log("Received AI response");
    // Make sure we have content to parse
    if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
      throw new Error("No content received from AI model");
    }
    const aiResult = JSON.parse(response.choices[0].message.content);
    
    // Transform the AI response to match our CompleteCV structure
    const cv: Partial<CompleteCV> = {
      personal: {
        firstName: aiResult.personal?.firstName || "",
        lastName: aiResult.personal?.lastName || "",
        email: aiResult.personal?.email || "",
        phone: aiResult.personal?.phone || "",
        linkedin: aiResult.personal?.linkedin || "",
      },
      professional: {
        summary: aiResult.summary || "",
      },
      keyCompetencies: {
        technicalSkills: aiResult.skills?.technical || [],
        softSkills: aiResult.skills?.soft || [],
      },
      experience: Array.isArray(aiResult.experience) ? aiResult.experience.map((exp: any) => ({
        companyName: exp.companyName || "",
        jobTitle: exp.jobTitle || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        isCurrent: exp.isCurrent || false,
        responsibilities: exp.responsibilities || "",
      })) : [],
      education: Array.isArray(aiResult.education) ? aiResult.education.map((edu: any) => ({
        schoolName: edu.schoolName || "",
        major: edu.major || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || "",
        achievements: edu.achievements || "",
      })) : [],
      certificates: Array.isArray(aiResult.certificates) ? aiResult.certificates.map((cert: any) => ({
        institution: cert.institution || "",
        name: cert.name || "",
        dateAcquired: cert.dateAcquired || "",
        expirationDate: cert.expirationDate || "",
        achievements: cert.achievements || "",
      })) : [],
      extracurricular: Array.isArray(aiResult.extracurricular) ? aiResult.extracurricular.map((extra: any) => ({
        organization: extra.organization || "",
        role: extra.role || "",
        startDate: extra.startDate || "",
        endDate: extra.endDate || "",
        isCurrent: extra.isCurrent || false,
        description: extra.description || "",
      })) : [],
      additional: {
        skills: aiResult.additional?.skills || [],
      },
      languages: Array.isArray(aiResult.languages) ? aiResult.languages.map((lang: any) => ({
        name: lang.name || "",
        proficiency: lang.proficiency || "intermediate",
      })) : [],
      templateSettings: {
        template: 'professional',
        includePhoto: false,
        sectionOrder: [
          { id: 'personal', name: 'Personal Information', visible: true, order: 0 },
          { id: 'summary', name: 'Professional Summary', visible: true, order: 1 },
          { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 2 },
          { id: 'experience', name: 'Experience', visible: true, order: 3 },
          { id: 'education', name: 'Education', visible: true, order: 4 },
          { id: 'certificates', name: 'Certificates', visible: true, order: 5 },
          { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 6 },
          { id: 'additional', name: 'Additional Information', visible: true, order: 7 },
        ]
      }
    };
    
    console.log("AI CV parsing complete");
    return cv;
  } catch (error) {
    console.error("Error parsing with AI:", error);
    throw new Error("Failed to parse CV with AI: " + (error instanceof Error ? error.message : String(error)));
  }
}