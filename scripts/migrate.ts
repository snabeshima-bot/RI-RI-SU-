// ビルド時に実行:DATABASE_URL があればマイグレーションを適用する
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate] DATABASE_URL 未設定のためスキップ");
    return;
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("[migrate] 完了");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
