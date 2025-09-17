import { GoogleGenerativeAI } from "@google/generative-ai";
import { cfg } from "../config";

const genAI = new GoogleGenerativeAI(cfg.geminiKey);

// Pick a light, cheap model for chat
const MODEL = "gemini-1.5-flash";

export async function generateWithSystem(
  systemPrompt: string,
  userText: string,
  context?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: systemPrompt });
  const parts = [{ text: context ? `${context}\n\nUser: ${userText}` : userText }];
  const res = await model.generateContent({ contents: [{ role: "user", parts }] });
  return res.response.text().trim();
}