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

export async function generateJSONWithSystem<T = unknown>(
  systemPrompt: string,
  userText: string
): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    // Hint to return JSON (Gemini supports this)
    generationConfig: { responseMimeType: "application/json" }
  });

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userText }] }],
  });

  const text = res.response.text().trim();
  // Sometimes models wrap JSON in code fences; strip if present
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  return JSON.parse(cleaned) as T;
}