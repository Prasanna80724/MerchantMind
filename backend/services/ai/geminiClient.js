import env from "../../config/env.js";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function isGeminiConfigured() {
  return Boolean(env.gemini.apiKey?.trim());
}

export function requireGemini() {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to backend/.env to use the inventory assistant.");
  }
}

/**
 * @param {string} prompt
 * @param {{ temperature?: number, maxOutputTokens?: number }} [options]
 */
export async function callGemini(prompt, options = {}) {
  requireGemini();

  const apiKey = env.gemini.apiKey.trim();
  const model = env.gemini.model || "gemini-2.0-flash";
  const url = `${API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.1,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error("[AI] Gemini API error:", response.status, errBody.slice(0, 500));
    throw new Error("AI service is temporarily unavailable. Please try again later.");
  }

  const json = await response.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("")?.trim() || "";

  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  return text;
}

export default callGemini;
