import { neon } from "@neondatabase/serverless";

let cachedSql: ReturnType<typeof neon> | null = null;

export function getDbClient() {
  if (cachedSql) {
    return cachedSql;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  cachedSql = neon(connectionString);
  return cachedSql;
}


