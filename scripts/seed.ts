// 動作確認用のサンプルデータを投入する(既存データは消さず、アーティストが0件のときのみ実行)
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { addDays, todayJST } from "../src/lib/dates";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const existing = await db.select().from(schema.artists);
  if (existing.length > 0) {
    console.log("[seed] 既にデータがあるためスキップ");
    await pool.end();
    return;
  }
  const t = todayJST();
  const d = (n: number) => addDays(t, n);

  const [a, b, c] = await db
    .insert(schema.artists)
    .values([
      { name: "サンプルグループA", color: "#6366f1", sortOrder: 10 },
      { name: "サンプルグループB", color: "#ec4899", sortOrder: 20 },
      { name: "サンプルグループC", color: "#10b981", sortOrder: 30 },
    ])
    .returning();

  const rels = await db
    .insert(schema.releases)
    .values([
      { artistId: a.id, title: "はじまりの歌", type: "single", musicSubmission: d(-12), jacketSubmission: d(-8), release: d(5), karaokeSubmission: d(3), karaokeRelease: d(19), musicSubmitted: true, jacketSubmitted: true },
      { artistId: a.id, title: "1st Album「Colors」", type: "album", musicSubmission: d(20), jacketSubmission: d(24), release: d(45), karaokeSubmission: d(38), karaokeRelease: d(59) },
      { artistId: b.id, title: "夏の終わりに", type: "single", musicSubmission: d(-2), jacketSubmission: d(3), release: d(17), karaokeSubmission: d(10), karaokeRelease: d(31) },
      { artistId: b.id, title: "Winter EP", type: "ep", musicSubmission: d(40), jacketSubmission: d(44), release: d(68) },
      { artistId: c.id, title: "ミッドナイト", type: "single", musicSubmission: d(-30), jacketSubmission: d(-26), release: d(-10), karaokeSubmission: d(0), karaokeRelease: d(12), musicSubmitted: true, jacketSubmitted: true },
      { artistId: c.id, title: "Brand New Day", type: "single", musicSubmission: d(7), jacketSubmission: d(9), release: d(28), karaokeSubmission: d(26), karaokeRelease: d(42) },
    ])
    .returning();

  await db.insert(schema.tracks).values([
    { releaseId: rels[0].id, trackNo: 1, title: "はじまりの歌" },
    { releaseId: rels[0].id, trackNo: 2, title: "はじまりの歌 (Instrumental)" },
    ...["Red", "Blue", "Green", "Yellow", "White"].map((title, i) => ({ releaseId: rels[1].id, trackNo: i + 1, title })),
    { releaseId: rels[2].id, trackNo: 1, title: "夏の終わりに" },
  ]);
  console.log("[seed] 完了");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
