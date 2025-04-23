import OpenAI from "openai";
import { CompleteCV } from '@shared/types';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Extracts structured CV data from text content using OpenAI
 * @param textContent Raw text content from the CV
 * @returns Structured CompleteCV object with extracted data
 */
export async function extractDataFromCV(textContent: string): Promise<CompleteCV> {
  try {
    console.log("Extracting data from CV text, length:", textContent.length);
    
    // Prepare a detailed system prompt that instructs the model on how to extract CV data
    const systemPrompt = `
      You are an expert CV analyzer with deep experience in human resources and talent acquisition.
      You're tasked with extracting structured information from the provided CV text to populate a CV builder application.
      
      Review the CV text carefully and extract all relevant information according to these guidelines:
      
      1. Personal Information:
         - Extract full name and split into first and last name
         - Get email address, phone number, and LinkedIn URL if present
      
      2. Professional Summary:
         - Identify professional summary, objective, or profile section
         - Look for sections titled "Profile", "Summary", "About Me", "Career Objective", etc.
      
      3. Skills:
         - Separate technical skills from soft skills
         - Technical skills include programming languages, tools, frameworks, methodologies, etc.
         - Soft skills include communication, leadership, teamwork, problem-solving, etc.
      
      4. Work Experience:
         - For each position, extract company name, job title, start date, end date, and responsibilities
         - Mark current positions with isCurrent=true and endDate=null
         - Consolidate responsibilities into a single coherent paragraph
      
      5. Education:
         - Extract institution name, degree/major, start date, end date, and achievements/honors
         - Include all education listings, with the most recent first
      
      6. Certifications:
         - Extract certification name, issuing institution, date acquired, and expiration date if available
      
      7. Extracurricular Activities:
         - Include volunteer work, community involvement, and other activities
         - Extract organization, role, dates, and description
      
      8. Languages:
         - Extract languages and their proficiency levels
         - Match proficiency to: "native", "fluent", "advanced", "intermediate", or "basic"
      
      9. Additional Skills:
         - Capture any remaining skills not classified as technical or soft skills
      
      Be flexible with section titles and infer content categories based on context.
      
      Format the output as a valid JSON object with this EXACT structure:
      {
        "personal": {
          "firstName": string,
          "lastName": string,
          "email": string,
          "phone": string,
          "linkedin": string (optional, can be empty string)
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
            "expirationDate": string (YYYY-MM-DD) (optional, can be null or empty string)
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
      
      Guidelines for handling missing information:
      - For dates, use YYYY-MM-DD format, and make educated guesses if only month/year are specified (use 01 for missing day)
      - If start date completely unknown, use a reasonable guess based on education timeline or work history
      - If a section is completely missing, provide the key with an empty array []
      - Never omit any of the required fields in the structure above
      - Don't make up information that isn't in the CV, but use reasonable defaults when partial information is available
      - If you can't determine first/last name separation, make a reasonable guess
      - Always provide at least one item for experience, education if any related information is present in the CV
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
      console.error("No content returned from OpenAI");
      throw new Error("No content returned from OpenAI");
    }

    try {
      const extractedData = JSON.parse(content);
      console.log("Successfully parsed OpenAI response to JSON");
      
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
      
      console.log("Successfully created complete CV data");
      return completeData;
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI response:", parseError);
      console.error("OpenAI raw response:", content);
      throw new Error("Failed to parse JSON from OpenAI response");
    }
  } catch (error) {
    console.error("Error extracting data from CV:", error);
    throw new Error(`Failed to extract data from CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}