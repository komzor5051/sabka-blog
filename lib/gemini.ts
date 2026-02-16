import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function generateText(
  prompt: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: options?.model ?? "gemini-2.0-flash",
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 8192,
    },
  });

  const result = await model.generateContent(prompt);
  return stripCodeFence(result.response.text());
}

/** Strip wrapping ```markdown ... ``` that Gemini sometimes adds */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:markdown|md|html)?\s*\n([\s\S]*?)\n```\s*$/);
  return match ? match[1] : trimmed;
}

export async function generatePro(prompt: string): Promise<string> {
  return generateText(prompt, { model: "gemini-2.0-flash", temperature: 0.8, maxTokens: 16384 });
}

export async function generateFlash(prompt: string): Promise<string> {
  return generateText(prompt, { model: "gemini-2.0-flash", temperature: 0.4, maxTokens: 8192 });
}
