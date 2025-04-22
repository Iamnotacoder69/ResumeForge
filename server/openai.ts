import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

/**
 * Sanitizes input text to prevent issues with OpenAI API
 * @param text Text to sanitize
 * @returns Sanitized text
 */
function sanitizeInput(text: string): string {
  // Remove HTML tags, DOCTYPE declarations and other problematic content
  return text
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

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

    // Sanitize the input text to avoid issues with OpenAI API
    const sanitizedText = sanitizeInput(text);
    
    // If the sanitized text is too short or empty, return the original
    if (sanitizedText.length < 10) {
      return text;
    }

    const promptMap = {
      summary: `Enhance the following professional summary to make it more impactful, professional, and concise. Maintain the key skills and experience mentioned but elevate the language: "${sanitizedText}"`,
      responsibilities: `Rewrite the following job responsibilities to sound more professional, achievement-oriented, and impactful. Use strong action verbs and quantify accomplishments where possible: "${sanitizedText}"`
    };

    console.log(`Processing AI enhancement for type: ${type}`);
    console.log(`Input text length: ${sanitizedText.length} characters`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest model as noted in the blueprint
      messages: [
        {
          role: "system",
          content: "You are a professional CV and resume writer with expertise in creating compelling professional content. Respond with plain text only, no markdown or special formatting."
        },
        {
          role: "user",
          content: promptMap[type]
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const enhancedText = response.choices[0].message.content?.trim() || text;
    console.log(`Enhanced text length: ${enhancedText.length} characters`);
    
    return enhancedText;
  } catch (error) {
    console.error("Error enhancing text with AI:", error);
    
    // Return the original text instead of throwing an error,
    // this way the application can continue even if OpenAI fails
    return text;
  }
}
