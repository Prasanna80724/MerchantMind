import mysql from "mysql2/promise";
import env from "./env.js";

/** Shared MySQL connection for standalone migration scripts. */
export async function createMigrationConnection(options = {}) {
  return mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    ...options,
  });
}

export function getDatabaseName() {
  return env.db.database;
}
