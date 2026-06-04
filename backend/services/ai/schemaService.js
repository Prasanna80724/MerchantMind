import db from "../../config/db.js";
import env from "../../config/env.js";

const CACHE_TTL_MS = Number.parseInt(process.env.SCHEMA_CACHE_TTL_MS || "3600000", 10);

let cache = {
  loadedAt: 0,
  database: null,
  tables: [],
  contextText: "",
};

const TABLES_SQL = `
  SELECT TABLE_NAME AS table_name, TABLE_COMMENT AS table_comment
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = ?
    AND TABLE_TYPE = 'BASE TABLE'
  ORDER BY TABLE_NAME
`;

const COLUMNS_SQL = `
  SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name,
         COLUMN_TYPE AS column_type, IS_NULLABLE AS is_nullable,
         COLUMN_KEY AS column_key, COLUMN_COMMENT AS column_comment
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = ?
  ORDER BY TABLE_NAME, ORDINAL_POSITION
`;

const FOREIGN_KEYS_SQL = `
  SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name,
         REFERENCED_TABLE_NAME AS referenced_table,
         REFERENCED_COLUMN_NAME AS referenced_column
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = ?
    AND REFERENCED_TABLE_NAME IS NOT NULL
  ORDER BY TABLE_NAME, COLUMN_NAME
`;

function buildContextText(database, tables, columns, foreignKeys) {
  const lines = [`Database: ${database}`, ""];

  for (const table of tables) {
    const tableCols = columns.filter((c) => c.table_name === table.table_name);
    lines.push(`Table: ${table.table_name}`);
    if (table.table_comment) {
      lines.push(`Description: ${table.table_comment}`);
    }
    lines.push("Columns:");
    for (const col of tableCols) {
      const parts = [
        `  - ${col.column_name}`,
        col.column_type,
        col.is_nullable === "NO" ? "NOT NULL" : "NULL",
      ];
      if (col.column_key === "PRI") parts.push("PRIMARY KEY");
      if (col.column_key === "MUL") parts.push("INDEX");
      if (col.column_comment) parts.push(`/* ${col.column_comment} */`);
      lines.push(parts.filter(Boolean).join(" "));
    }

    const fks = foreignKeys.filter((f) => f.table_name === table.table_name);
    if (fks.length > 0) {
      lines.push("Foreign keys:");
      for (const fk of fks) {
        lines.push(
          `  - ${fk.column_name} -> ${fk.referenced_table}.${fk.referenced_column}`
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Discover schema from INFORMATION_SCHEMA (cached).
 */
export async function getSchemaContext(forceRefresh = false) {
  const database = env.db.database;
  const now = Date.now();

  if (
    !forceRefresh &&
    cache.contextText &&
    cache.database === database &&
    now - cache.loadedAt < CACHE_TTL_MS
  ) {
    return {
      database: cache.database,
      tables: cache.tables,
      contextText: cache.contextText,
      fromCache: true,
    };
  }

  const [tables] = await db.query(TABLES_SQL, [database]);
  const [columns] = await db.query(COLUMNS_SQL, [database]);
  const [foreignKeys] = await db.query(FOREIGN_KEYS_SQL, [database]);

  const contextText = buildContextText(database, tables, columns, foreignKeys);

  cache = {
    loadedAt: now,
    database,
    tables: tables.map((t) => t.table_name),
    contextText,
  };

  return { database, tables: cache.tables, contextText, fromCache: false };
}

/** Tables that include user_id for tenant scoping validation. */
export async function getTenantTableNames() {
  const { database } = await getSchemaContext();
  const [rows] = await db.query(
    `SELECT DISTINCT TABLE_NAME AS table_name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND COLUMN_NAME = 'user_id'`,
    [database]
  );
  return rows.map((r) => r.table_name);
}

export function clearSchemaCache() {
  cache = { loadedAt: 0, database: null, tables: [], contextText: "" };
}

export default getSchemaContext;
