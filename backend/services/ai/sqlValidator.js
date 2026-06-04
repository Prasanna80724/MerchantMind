const FORBIDDEN_PATTERNS = [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bTRUNCATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bEXECUTE\b/i,
  /\bCALL\b/i,
  /\bUNION\b/i,
  /\bINTO\s+OUTFILE\b/i,
  /\bLOAD_FILE\b/i,
  /\bINFORMATION_SCHEMA\b/i,
  /\bPERFORMANCE_SCHEMA\b/i,
  /\bMYSQL\./i,
  /\bSYS\./i,
  /\bFOR\s+UPDATE\b/i,
  /\bLOCK\s+IN\s+SHARED\b/i,
];

const BLOCKED_TABLES = [/\busers\b/i];

/**
 * Validate AI-generated SQL before execution.
 * @param {string} sql
 * @param {{ userId: number, tenantTables: string[] }} ctx
 */
export function validateSql(sql, { userId, tenantTables = [] }) {
  if (!sql || typeof sql !== "string") {
    return { ok: false, reason: "Empty SQL." };
  }

  const normalized = sql.trim().replace(/;+\s*$/, "");

  if (normalized.includes(";")) {
    return { ok: false, reason: "Multiple SQL statements are not allowed." };
  }

  const upper = normalized.toUpperCase();
  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    return { ok: false, reason: "Only SELECT queries are allowed." };
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) {
      return { ok: false, reason: `Forbidden SQL pattern: ${pattern.source}` };
    }
  }

  for (const pattern of BLOCKED_TABLES) {
    if (pattern.test(normalized)) {
      return { ok: false, reason: "Access to the users table is not allowed." };
    }
  }

  if (/\bdocument_pdf\b/i.test(normalized)) {
    return { ok: false, reason: "document_pdf column cannot be queried." };
  }

  const referencedTenantTables = tenantTables.filter((table) =>
    new RegExp(`\\b${table}\\b`, "i").test(normalized)
  );

  const userScope = new RegExp(`\\buser_id\\s*=\\s*${userId}\\b`, "i");
  if (referencedTenantTables.length > 0 && !userScope.test(normalized)) {
    return {
      ok: false,
      reason: `Query must filter tenant data with user_id = ${userId} (tables used: ${referencedTenantTables.join(", ")}).`,
    };
  }

  return { ok: true, sql: normalized };
}

export default validateSql;
