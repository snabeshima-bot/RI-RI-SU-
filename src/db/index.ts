import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { databaseUrl } from "./url";

const globalForDb = globalThis as unknown as { db?: NodePgDatabase<typeof schema> };

function createDb() {
  const connectionString = databaseUrl();
  if (!connectionString) throw new Error("DATABASE_URL が設定されていません");
  const pool = new Pool({ connectionString, max: 5 });
  return drizzle(pool, { schema });
}

export function getDb() {
  globalForDb.db ??= createDb();
  return globalForDb.db;
}

export { schema };
