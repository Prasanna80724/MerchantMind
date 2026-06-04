import { callGemini } from "./geminiClient.js";

const UNAVAILABLE_PREFIX = /^SCHEMA_UNAVAILABLE:\s*(.+)/im;

/**
 * Extract raw SQL from Gemini output (strip markdown fences).
 */
export function extractSql(raw) {
  let text = String(raw || "").trim();

  const unavailable = text.match(UNAVAILABLE_PREFIX);
  if (unavailable) {
    const err = new Error("SCHEMA_UNAVAILABLE");
    err.detail = unavailable[1].trim();
    throw err;
  }

  const fence = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (fence) {
    text = fence[1].trim();
  }
  text = text.replace(/^sql\s*/i, "").trim();

  const selectMatch = text.match(/((?:WITH|SELECT)\b[\s\S]*)/i);
  if (selectMatch) {
    text = selectMatch[1].trim();
  }

  return text.replace(/;+\s*$/, "");
}

function buildPrompt({ question, schemaContext, userId, correction }) {
  const correctionBlock = correction
    ? `\nCORRECTION REQUIRED:\n${correction}\nRegenerate a single valid SELECT (or SCHEMA_UNAVAILABLE) that fixes the issue.\n`
    : "";

  return `You are a MySQL Text-to-SQL engine for MerchantMind. Map the user question to exactly one read-only query using ONLY the schema below.

OUTPUT RULES (strict):
- Return EITHER one SQL SELECT statement OR one line: SCHEMA_UNAVAILABLE: <reason>
- No markdown. No code fences. No explanations. No comments.
- Never refuse a question that can be answered from the schema; generate SQL instead.
- Do not use predefined intent categories; infer from schema + domain guide.

SQL RULES:
- Single statement only (no semicolons inside).
- SELECT or WITH ... SELECT only.
- No INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, UNION.
- Never query table users.
- Never select document_pdf from purchase_orders.
- Every query touching tenant tables MUST include user_id = ${userId} (literal integer).
- Use only tables and columns from the schema.
- Add LIMIT 100 when returning many rows unless user specifies a smaller top N.

${correctionBlock}
USER QUESTION:
${question}

DATABASE SCHEMA AND DOMAIN GUIDE:
${schemaContext}`;
}

/**
 * Generate a single read-only SQL query from natural language.
 */
export async function generateSql({ question, schemaContext, userId, correction = null }) {
  const prompt = buildPrompt({ question, schemaContext, userId, correction });

  let raw;
  try {
    raw = await callGemini(prompt, { temperature: 0, maxOutputTokens: 2048 });
  } catch (err) {
    if (err.message?.includes("not configured") || err.message?.includes("temporarily unavailable")) {
      throw err;
    }
    console.error("[AI] Gemini call failed:", err.message);
    throw new Error("SQL_GENERATION_FAILED");
  }

  let sql;
  try {
    sql = extractSql(raw);
  } catch (err) {
    if (err.message === "SCHEMA_UNAVAILABLE") {
      err.detail = err.detail || "Requested data is not represented in the database schema.";
      throw err;
    }
    throw err;
  }

  if (!sql || !/^(SELECT|WITH)\b/i.test(sql)) {
    const unavailable = String(raw).match(UNAVAILABLE_PREFIX);
    if (unavailable) {
      const err = new Error("SCHEMA_UNAVAILABLE");
      err.detail = unavailable[1].trim();
      throw err;
    }

    if (!correction) {
      return generateSql({
        question,
        schemaContext,
        userId,
        correction:
          "Your last reply was not valid SQL. Output only a single SELECT statement starting with SELECT or WITH, including user_id = " +
          userId +
          ", or SCHEMA_UNAVAILABLE: reason.",
      });
    }

    console.error("[AI] No SQL in model output:", String(raw).slice(0, 400));
    throw new Error("SQL_GENERATION_FAILED");
  }

  return sql;
}

export default generateSql;
