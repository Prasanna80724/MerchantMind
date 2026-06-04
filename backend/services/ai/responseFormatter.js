import { callGemini } from "./geminiClient.js";

const FILLER_PATTERNS = [
  /^hello\b/i,
  /^hi\b/i,
  /^hey\b/i,
  /great question/i,
  /certainly/i,
  /i'd be happy/i,
  /looking at your/i,
  /it appears/i,
  /based on your/i,
  /hope this helps/i,
  /here('s| is)/i,
];

export function sanitizeExecutiveText(text) {
  if (!text) return "";
  const lines = String(text)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !FILLER_PATTERNS.some((p) => p.test(l)));
  return lines.slice(0, 3).join("\n").trim();
}

function buildFallbackSummary(presentation) {
  if (!presentation || presentation.type === "empty") {
    return "";
  }
  return presentation.title || "";
}

/**
 * Optional one-line headline for generic results only. Structured types use UI templates.
 */
export async function formatResponse({ question, results, presentation }) {
  if (presentation?.type && presentation.type !== "generic") {
    return buildFallbackSummary(presentation);
  }

  const payload = {
    rowCount: results.rowCount,
    sample: results.rows.slice(0, 8),
  };

  const prompt = `You are MerchantMind Assistant.

Rules:
- Be concise and data-first.
- No greetings. No filler. No explanations unless essential.
- Maximum 1 short headline line (under 12 words).
- No markdown tables. No conversational tone.
- Act like a dashboard summary, not a chatbot.

User question:
${question}

Data (JSON):
${JSON.stringify(payload, null, 2)}

Output only the headline.`;

  try {
    const raw = await callGemini(prompt, { temperature: 0, maxOutputTokens: 64 });
    return sanitizeExecutiveText(raw);
  } catch (err) {
    console.error("[AI] Headline fallback:", err.message);
    return results.rowCount > 0 ? `${results.rowCount} records` : "No records";
  }
}

export default formatResponse;
