import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Enhances text using OpenAI's GPT model
 * @param text Original text to enhance
 * @param type Type of text (summary or responsibilities)
 * @returns Enhanced professional text
 */
export async function enhanceTextWithAI(text: string, type: "summary" | "responsibilities"): Promise<string> {
  try {
    if (!text.trim()) {
      return text;
    }

    let prompt = "";

    if (type === "summary") {
      prompt = `Enhance the following professional summary to make it more compelling and impressive for a CV/resume.
Use active voice, professional language, and focus on quantifiable achievements where possible.
Keep a similar length to the original text.

Original summary:
${text}

Enhanced summary:`;
    } else {
      prompt = `Enhance the following job responsibilities to make them more professional and impactful for a CV/resume.
Use action verbs, highlight achievements, and add quantifiable metrics where logical.
Keep a similar length to the original text.

Original responsibilities:
${text}

Enhanced responsibilities:`;
    }

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a professional CV writer helping to improve the content of a resume." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const enhancedText = response.choices[0].message.content?.trim();
    return enhancedText || text;
  } catch (error) {
    console.error("Error enhancing text with AI:", error);
    // Return original text if AI enhancement fails
    return text;
  }
}