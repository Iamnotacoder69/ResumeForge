import OpenAI from "openai";

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
