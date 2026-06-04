import env from "../../config/env.js";
import { getSchemaContext, getTenantTableNames } from "./schemaService.js";
import { buildSchemaGuide } from "./schemaGuide.js";
import { generateSql } from "./sqlGenerator.js";
import { validateSql } from "./sqlValidator.js";
import { executeReadOnlySql, mapExecutionError } from "./sqlExecutor.js";
import { formatResponse } from "./responseFormatter.js";
import { buildPresentation } from "./presentationBuilder.js";
import { isGeminiConfigured } from "./geminiClient.js";

export const SUGGESTED_QUESTIONS = [
  "Profit of this month",
  "Most sold item",
  "Highest revenue product",
  "Top customer",
  "Inventory value",
  "Top 5 products by stock",
  "Sales this week",
  "Purchase orders pending approval",
  "Which supplier has supplied the most products?",
];

const AI_DEBUG = env.ai?.debug === true || process.env.AI_DEBUG === "true";

function debugLog(label, payload) {
  if (!AI_DEBUG) return;
  console.info(`[AI:debug] ${label}`, payload);
}

function logPipelineStep(logBase, step, extra = {}) {
  console.info(`[AI] ${step}`, { ...logBase, ...extra });
}

/**
 * Full Text-to-SQL pipeline — capabilities come from schema, not intent lists.
 */
export async function processChatQuestion({ question, userId, username }) {
  if (!isGeminiConfigured()) {
    throw new Error("ASSISTANT_UNAVAILABLE");
  }

  const startedAt = Date.now();
  const logBase = { userId, username, questionPreview: question.slice(0, 120) };

  logPipelineStep(logBase, "Request");
  debugLog("User Question", { question });

  const { contextText: schemaBody } = await getSchemaContext();
  const schemaContext = `${schemaBody}\n\n${buildSchemaGuide(userId)}`;
  const tenantTables = await getTenantTableNames();

  let generatedSql;
  try {
    generatedSql = await generateSql({
      question,
      schemaContext,
      userId,
    });
  } catch (err) {
    if (err.message === "SCHEMA_UNAVAILABLE") {
      logPipelineStep(logBase, "Schema unavailable", { detail: err.detail });
      debugLog("Validation Result", { ok: false, reason: err.detail });
      const e = new Error("SCHEMA_UNAVAILABLE");
      e.detail = err.detail;
      throw e;
    }
    if (err.message === "SQL_GENERATION_FAILED") {
      logPipelineStep(logBase, "SQL generation failed", { error: err.message });
      throw new Error("SQL_GENERATION_FAILED");
    }
    throw err;
  }

  logPipelineStep(logBase, "Generated SQL", { sql: generatedSql });
  debugLog("Generated SQL", { sql: generatedSql });

  let validation = validateSql(generatedSql, { userId, tenantTables });
  debugLog("Validation Result", validation);

  if (!validation.ok) {
    logPipelineStep(logBase, "Validation rejected (retry)", {
      sql: generatedSql,
      reason: validation.reason,
    });

    try {
      generatedSql = await generateSql({
        question,
        schemaContext,
        userId,
        correction: `SQL validation failed: ${validation.reason}. Include user_id = ${userId} for all tenant tables used.`,
      });
      validation = validateSql(generatedSql, { userId, tenantTables });
      logPipelineStep(logBase, "Generated SQL (retry)", { sql: generatedSql });
      debugLog("Generated SQL (retry)", { sql: generatedSql });
      debugLog("Validation Result (retry)", validation);
    } catch (retryErr) {
      if (retryErr.message === "SCHEMA_UNAVAILABLE") {
        const e = new Error("SCHEMA_UNAVAILABLE");
        e.detail = retryErr.detail;
        throw e;
      }
    }
  }

  if (!validation.ok) {
    logPipelineStep(logBase, "Validation rejected", {
      sql: generatedSql,
      reason: validation.reason,
    });
    throw new Error("REQUEST_NOT_ALLOWED");
  }

  let results;
  try {
    results = await executeReadOnlySql(validation.sql);
  } catch (err) {
    logPipelineStep(logBase, "Execution failed", {
      sql: validation.sql,
      error: err.message,
    });
    mapExecutionError(err);
  }

  const presentation = buildPresentation(question, results);
  const summary = await formatResponse({ question, results, presentation });

  logPipelineStep(logBase, "Success", {
    presentationType: presentation.type,
    rowCount: results.rowCount,
    durationMs: Date.now() - startedAt,
  });

  return {
    summary,
    presentation: JSON.parse(
      JSON.stringify(presentation, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    ),
    rowCount: results.rowCount,
  };
}

export default processChatQuestion;
