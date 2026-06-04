import db from "../../config/db.js";
import env from "../../config/env.js";

const QUERY_TIMEOUT_MS = env.ai?.queryTimeoutMs ?? Number.parseInt(process.env.AI_QUERY_TIMEOUT_MS || "15000", 10);
const MAX_ROWS = env.ai?.maxResultRows ?? Number.parseInt(process.env.AI_MAX_RESULT_ROWS || "500", 10);

const BLOB_COLUMNS = new Set(["document_pdf"]);

const SCHEMA_ERROR_PATTERN =
  /unknown column|unknown table|doesn't exist|does not exist|no such table|bad field/i;

export function mapExecutionError(err) {
  const msg = err?.message || String(err);
  if (SCHEMA_ERROR_PATTERN.test(msg)) {
    const e = new Error("SCHEMA_UNAVAILABLE");
    e.detail = "The query referenced data that is not available in the current schema.";
    throw e;
  }
  if (msg.includes("timed out")) {
    throw err;
  }
  throw new Error("DATA_FETCH_FAILED");
}

function withRowLimit(sql) {
  if (/\bLIMIT\s+\d+/i.test(sql)) {
    return sql;
  }
  return `${sql} LIMIT ${MAX_ROWS}`;
}

function sanitizeRows(rows, fields) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { rows: [], fields: fields || [] };
  }

  const blobKeys = new Set(
    (fields || [])
      .map((f) => f.name || f)
      .filter((name) => BLOB_COLUMNS.has(name) || name?.includes("pdf"))
  );

  const sanitized = rows.map((row) => {
    const copy = { ...row };
    for (const key of Object.keys(copy)) {
      if (blobKeys.has(key)) {
        copy[key] = "[binary data omitted]";
      }
      if (Buffer.isBuffer(copy[key])) {
        copy[key] = "[binary data omitted]";
      }
    }
    return copy;
  });

  return { rows: sanitized, fields: (fields || []).map((f) => f.name || f) };
}

/**
 * Execute validated read-only SQL with timeout and row limits.
 */
export async function executeReadOnlySql(sql) {
  const finalSql = withRowLimit(sql);

  const executePromise = db.query(finalSql);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error("Query timed out. Try a more specific question.")),
      QUERY_TIMEOUT_MS
    );
  });

  try {
    const [rows, fields] = await Promise.race([executePromise, timeoutPromise]);
    const rowArray = Array.isArray(rows) ? rows : [];
    const { rows: sanitized, fields: columnNames } = sanitizeRows(rowArray, fields);

    return {
      rows: sanitized,
      rowCount: sanitized.length,
      columns: columnNames,
      truncated: sanitized.length >= MAX_ROWS,
    };
  } catch (err) {
    mapExecutionError(err);
  }
}

export default executeReadOnlySql;
