import OpenAI from "openai";
import { CompleteCV } from '@shared/types';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export async function extractDataFromCV(textContent: string): Promise<CompleteCV> {
  try {
    // Prepare a system prompt that instructs the model on how to extract CV data
    const systemPrompt = `
      You are an expert CV analyzer. Extract structured information from the provided CV text.
      Follow these guidelines:
      
      1. Extract personal information (name, email, phone, LinkedIn)
      2. Identify the professional summary or objective
      3. Extract technical and soft skills, classifying them appropriately
      4. Identify work experience entries with company names, job titles, dates, and responsibilities
      5. Extract education details including institutions, degrees, dates
      6. Identify certifications if present
      7. Look for extracurricular activities or volunteer work
      8. Extract any languages and proficiency levels mentioned
      
      Be flexible with section titles - "Career Objective," "Summary," "About Me" should all map to the summary section.
      
      Format the output as a valid JSON object that follows this structure:
      {
        "personal": {
          "firstName": string,
          "lastName": string,
          "email": string,
          "phone": string,
          "linkedin": string (optional)
        },
        "professional": {
          "summary": string
        },
        "keyCompetencies": {
          "technicalSkills": string[],
          "softSkills": string[]
        },
        "experience": [
          {
            "companyName": string,
            "jobTitle": string,
            "startDate": string (YYYY-MM-DD),
            "endDate": string (YYYY-MM-DD) or null if current,
            "isCurrent": boolean,
            "responsibilities": string
          }
        ],
        "education": [
          {
            "schoolName": string,
            "major": string,
            "startDate": string (YYYY-MM-DD),
            "endDate": string (YYYY-MM-DD),
            "achievements": string (optional)
          }
        ],
        "certificates": [
          {
            "institution": string,
            "name": string,
            "dateAcquired": string (YYYY-MM-DD),
            "expirationDate": string (YYYY-MM-DD) (optional)
          }
        ],
        "extracurricular": [
          {
            "organization": string,
            "role": string,
            "startDate": string (YYYY-MM-DD),
            "endDate": string (YYYY-MM-DD) or null if current,
            "isCurrent": boolean,
            "description": string
          }
        ],
        "languages": [
          {
            "name": string,
            "proficiency": "native" | "fluent" | "advanced" | "intermediate" | "basic"
          }
        ],
        "additional": {
          "skills": string[]
        }
      }
      
      Make educated guesses for date formats if exact dates aren't specified.
      If a section is missing, include the section key with empty arrays or null values.
      Ensure all required fields are populated with at least placeholder values if information can't be found.
    `;

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract structured data from this CV: \n\n${textContent}` }
      ],
      temperature: 0.2, // Lower temperature for more consistent outputs
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const extractedData = JSON.parse(content);
    
    // Fill in template settings with defaults
    const completeData: CompleteCV = {
      ...extractedData,
      templateSettings: {
        template: 'professional',
        includePhoto: false,
        sectionOrder: [
          { id: 'personal', name: 'Personal Information', visible: true, order: 0 },
          { id: 'summary', name: 'Professional Summary', visible: true, order: 1 },
          { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 2 },
          { id: 'experience', name: 'Work Experience', visible: true, order: 3 },
          { id: 'education', name: 'Education', visible: true, order: 4 },
          { id: 'certificates', name: 'Certificates', visible: true, order: 5 },
          { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 6 },
          { id: 'additional', name: 'Additional Information', visible: true, order: 7 }
        ]
      }
    };

    return completeData;
  } catch (error) {
    console.error("Error extracting data from CV:", error);
    throw new Error(`Failed to extract data from CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}