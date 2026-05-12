import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

export function sql() {
  if (!_sql) {
    const dsn = process.env.DATABASE_URL;
    if (!dsn) throw new Error("DATABASE_URL is not set");
    _sql = neon(dsn);
  }
  return _sql;
}

export function isConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
