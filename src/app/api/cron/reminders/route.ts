import { and, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { appUrl } from "@/lib/app-url";
import { addDays, isValidDate, todayJST } from "@/lib/dates";
import { renderReminderEmail, sendMail } from "@/lib/mail";
import { REMIND_DAYS_BEFORE, buildDigests, collectDue, dueKey, type Subscriber } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const { artists, releases, users, subscriptions, reminderLogs } = schema;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ?date=YYYY-MM-DD で「今日」を上書きできる(手動テスト用)。?dry=1 で送信せず結果のみ返す。
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const dry = url.searchParams.get("dry") === "1";
  const today = dateParam && isValidDate(dateParam) ? dateParam : todayJST();
  const target = addDays(today, REMIND_DAYS_BEFORE);

  const db = getDb();
  const rows = await db
    .select({ r: releases, artistName: artists.name })
    .from(releases)
    .innerJoin(artists, eq(artists.id, releases.artistId))
    .where(
      or(
        eq(releases.release, target),
        eq(releases.musicSubmission, target),
        eq(releases.jacketSubmission, target),
        eq(releases.karaokeRelease, target),
        eq(releases.karaokeSubmission, target),
      ),
    );

  let due = collectDue(
    rows.map(({ r, artistName }) => ({ ...r, artistName })),
    target,
  );

  // 送信済みを除外(Cronの再実行による二重送信防止)
  if (due.length > 0) {
    const logs = await db
      .select()
      .from(reminderLogs)
      .where(and(eq(reminderLogs.targetDate, target), inArray(reminderLogs.releaseId, due.map((d) => d.releaseId))));
    const sent = new Set(logs.map((l) => dueKey({ releaseId: l.releaseId, milestone: l.milestone as never, date: l.targetDate })));
    due = due.filter((d) => !sent.has(dueKey(d)));
  }
  if (due.length === 0) return NextResponse.json({ today, target, due: 0, sent: 0 });

  const [userRows, subRows] = await Promise.all([db.select().from(users), db.select().from(subscriptions)]);
  const subscribers: Subscriber[] = userRows.map((u) => ({
    email: u.email,
    notifyAll: u.notifyAll,
    artistIds: subRows.filter((s) => s.userEmail === u.email).map((s) => s.artistId),
  }));
  const digests = buildDigests(due, subscribers);

  if (dry) {
    return NextResponse.json({ today, target, due, recipients: Object.fromEntries([...digests].map(([k, v]) => [k, v.length])) });
  }

  const base = appUrl();
  const failures: string[] = [];
  for (const [email, items] of digests) {
    try {
      await sendMail(email, renderReminderEmail(items, base));
    } catch (e) {
      failures.push(`${email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 全員への送信に失敗した場合は記録せず、手動再実行で再送できるようにする
  if (failures.length < digests.size) {
    await db
      .insert(reminderLogs)
      .values(due.map((d) => ({ releaseId: d.releaseId, milestone: d.milestone, targetDate: d.date })))
      .onConflictDoNothing();
  }

  if (failures.length) console.error("[reminders] 送信失敗", failures);
  return NextResponse.json({ today, target, due: due.length, sent: digests.size - failures.length, failures });
}
