"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/auth";
import { getDb, schema } from "@/db";
import { appUrl } from "@/lib/app-url";
import { CREDIT_ROLES } from "@/lib/credits";
import { isValidDate } from "@/lib/dates";
import { MILESTONE_KEYS } from "@/lib/milestones";
import { deleteReleaseFromCalendar, syncReleaseToCalendar } from "@/lib/gcal";

const { artists, releases, tracks, trackCredits, writers, users, subscriptions } = schema;

export type FormState = { error?: string; ok?: string } | undefined;

const optionalDate = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s === "" || isValidDate(s), "日付の形式が正しくありません")
  .transform((s) => (s === "" ? null : s));

const releaseSchema = z.object({
  artistId: z.coerce.number().int().positive({ message: "アーティストを選択してください" }),
  title: z.string().trim().min(1, "タイトルを入力してください").max(200),
  type: z.enum(["single", "ep", "album", "other"]),
  notes: z.string().max(5000).default(""),
  release: optionalDate,
  musicSubmission: optionalDate,
  jacketSubmission: optionalDate,
  karaokeRelease: optionalDate,
  karaokeSubmission: optionalDate,
  demoDeadline: optionalDate,
  recording: optionalDate,
  mixDeadline: optionalDate,
  liveDeadline: optionalDate,
  masterDeadline: optionalDate,
  teaserShoot: optionalDate,
  teaserRelease: optionalDate,
  demoSubmitted: z.boolean(),
  mixSubmitted: z.boolean(),
  liveSubmitted: z.boolean(),
  masterSubmitted: z.boolean(),
  musicSubmitted: z.boolean(),
  jacketSubmitted: z.boolean(),
  karaokeSubmitted: z.boolean(),
  tracks: z
    .array(
      z.object({
        title: z.string().trim().max(200),
        isrc: z.string().trim().max(20).default(""),
        credits: z
          .object({
            lyrics: z.array(z.number().int().positive()).default([]),
            composition: z.array(z.number().int().positive()).default([]),
            arrangement: z.array(z.number().int().positive()).default([]),
          })
          .default({ lyrics: [], composition: [], arrangement: [] }),
      }),
    )
    .transform((ts) => ts.filter((t) => t.title !== "")),
});

function parseRelease(fd: FormData) {
  let trackList: unknown = [];
  try {
    trackList = JSON.parse(String(fd.get("tracks") || "[]"));
  } catch {
    // 不正なJSONは空として扱う
  }
  return releaseSchema.safeParse({
    artistId: fd.get("artistId"),
    title: fd.get("title") ?? "",
    type: fd.get("type") ?? "single",
    notes: fd.get("notes") ?? "",
    release: fd.get("release") ?? "",
    musicSubmission: fd.get("musicSubmission") ?? "",
    jacketSubmission: fd.get("jacketSubmission") ?? "",
    karaokeRelease: fd.get("karaokeRelease") ?? "",
    karaokeSubmission: fd.get("karaokeSubmission") ?? "",
    demoDeadline: fd.get("demoDeadline") ?? "",
    recording: fd.get("recording") ?? "",
    mixDeadline: fd.get("mixDeadline") ?? "",
    liveDeadline: fd.get("liveDeadline") ?? "",
    masterDeadline: fd.get("masterDeadline") ?? "",
    teaserShoot: fd.get("teaserShoot") ?? "",
    teaserRelease: fd.get("teaserRelease") ?? "",
    demoSubmitted: fd.get("demoSubmitted") === "on",
    mixSubmitted: fd.get("mixSubmitted") === "on",
    liveSubmitted: fd.get("liveSubmitted") === "on",
    masterSubmitted: fd.get("masterSubmitted") === "on",
    musicSubmitted: fd.get("musicSubmitted") === "on",
    jacketSubmitted: fd.get("jacketSubmitted") === "on",
    karaokeSubmitted: fd.get("karaokeSubmitted") === "on",
    tracks: trackList,
  });
}

async function syncCalendar(releaseId: number) {
  const db = getDb();
  const [row] = await db
    .select({ r: releases, artistName: artists.name })
    .from(releases)
    .innerJoin(artists, eq(artists.id, releases.artistId))
    .where(eq(releases.id, releaseId));
  if (!row) return;
  const { eventIds, error } = await syncReleaseToCalendar(
    { ...row.r, artistName: row.artistName },
    appUrl(),
  );
  await db.update(releases).set({ gcalEventIds: eventIds, gcalError: error }).where(eq(releases.id, releaseId));
}

export async function saveRelease(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseRelease(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  const { tracks: trackList, ...data } = parsed.data;
  const idRaw = fd.get("id");
  const db = getDb();

  const id = await db.transaction(async (tx) => {
    let releaseId: number;
    if (idRaw) {
      releaseId = Number(idRaw);
      await tx
        .update(releases)
        .set({ ...data, updatedBy: user.email, updatedAt: new Date() })
        .where(eq(releases.id, releaseId));
      await tx.delete(tracks).where(eq(tracks.releaseId, releaseId));
    } else {
      const [created] = await tx
        .insert(releases)
        .values({ ...data, createdBy: user.email, updatedBy: user.email })
        .returning({ id: releases.id });
      releaseId = created.id;
    }
    if (trackList.length > 0) {
      const created = await tx
        .insert(tracks)
        .values(trackList.map((t, i) => ({ releaseId, trackNo: i + 1, title: t.title, isrc: t.isrc })))
        .returning({ id: tracks.id });
      const creditRows = trackList.flatMap((t, i) =>
        CREDIT_ROLES.flatMap(({ key }) =>
          [...new Set(t.credits[key])].map((writerId, order) => ({ trackId: created[i].id, writerId, role: key, sortOrder: order })),
        ),
      );
      if (creditRows.length > 0) await tx.insert(trackCredits).values(creditRows);
    }
    return releaseId;
  });

  await syncCalendar(id);
  revalidatePath("/", "layout");
  redirect(`/releases/${id}?saved=1`);
}

export async function resyncCalendar(fd: FormData) {
  await requireUser();
  const id = Number(fd.get("id"));
  await syncCalendar(id);
  revalidatePath(`/releases/${id}`);
}

export async function toggleSubmitted(fd: FormData) {
  await requireUser();
  const id = Number(fd.get("id"));
  const field = String(fd.get("field"));
  if (!["demoSubmitted", "mixSubmitted", "liveSubmitted", "masterSubmitted", "musicSubmitted", "jacketSubmitted", "karaokeSubmitted"].includes(field)) return;
  const value = fd.get("value") === "true";
  await getDb()
    .update(releases)
    .set({ [field]: value, updatedAt: new Date() })
    .where(eq(releases.id, id));
  await syncCalendar(id);
  revalidatePath("/", "layout");
}

export async function deleteRelease(fd: FormData) {
  await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const [row] = await db.select({ ids: releases.gcalEventIds }).from(releases).where(eq(releases.id, id));
  if (row) await deleteReleaseFromCalendar(row.ids);
  await db.delete(releases).where(eq(releases.id, id));
  revalidatePath("/", "layout");
  redirect("/");
}

// ---------- 一括取り込み ----------

const importSchema = z.object({
  artistId: z.coerce.number().int().positive({ message: "アーティストを選択してください" }),
  rows: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        dates: z.partialRecord(z.enum(MILESTONE_KEYS), z.string().refine(isValidDate)),
      }),
    )
    .min(1, "取り込む行がありません")
    .max(200),
});

export async function importReleases(input: unknown): Promise<FormState & { count?: number }> {
  const user = await requireUser();
  const parsed = importSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "取り込み内容を確認してください" };
  const { artistId, rows } = parsed.data;
  const db = getDb();
  const created = await db
    .insert(releases)
    .values(rows.map((r) => ({ artistId, title: r.title, type: "single", ...r.dates, createdBy: user.email, updatedBy: user.email })))
    .returning({ id: releases.id });
  for (const { id } of created) await syncCalendar(id);
  revalidatePath("/", "layout");
  return { ok: `${created.length}件を登録しました`, count: created.length };
}

// ---------- アーティスト ----------

const artistSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "色の形式が正しくありません"),
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveArtist(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const parsed = artistSchema.safeParse({
    name: fd.get("name") ?? "",
    color: fd.get("color") ?? "",
    sortOrder: fd.get("sortOrder") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = getDb();
  const id = fd.get("id");
  if (id) {
    await db.update(artists).set(parsed.data).where(eq(artists.id, Number(id)));
  } else {
    await db.insert(artists).values(parsed.data);
  }
  revalidatePath("/", "layout");
  return { ok: id ? "更新しました" : "追加しました" };
}

export async function deleteArtist(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const used = await db.select({ id: releases.id }).from(releases).where(eq(releases.artistId, id)).limit(1);
  if (used.length > 0) return { error: "リリースが登録されているアーティストは削除できません" };
  await db.delete(artists).where(eq(artists.id, id));
  revalidatePath("/", "layout");
  return { ok: "削除しました" };
}

// ---------- 作家 ----------

const writerName = z.string().trim().min(1, "名前を入力してください").max(100);

/** 作家を登録する(同名がいればそれを返す)。編集画面からその場で追加するときにも使う */
export async function createWriter(name: string): Promise<{ id: number; name: string } | { error: string }> {
  await requireUser();
  const parsed = writerName.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "名前を確認してください" };
  const db = getDb();
  const [existing] = await db.select().from(writers).where(eq(writers.name, parsed.data));
  if (existing) return { id: existing.id, name: existing.name };
  const [created] = await db.insert(writers).values({ name: parsed.data }).returning();
  revalidatePath("/writers");
  return { id: created.id, name: created.name };
}

export async function saveWriter(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const parsed = writerName.safeParse(fd.get("name") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = getDb();
  const id = Number(fd.get("id"));
  const [dup] = await db.select({ id: writers.id }).from(writers).where(eq(writers.name, parsed.data));
  if (dup && dup.id !== id) return { error: "同じ名前の作家がすでに登録されています" };
  if (id) {
    await db.update(writers).set({ name: parsed.data }).where(eq(writers.id, id));
  } else {
    await db.insert(writers).values({ name: parsed.data });
  }
  revalidatePath("/", "layout");
  return { ok: id ? "更新しました" : "追加しました" };
}

export async function deleteWriter(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const used = await db.select({ id: trackCredits.trackId }).from(trackCredits).where(eq(trackCredits.writerId, id)).limit(1);
  if (used.length > 0) return { error: "担当曲がある作家は削除できません" };
  await db.delete(writers).where(eq(writers.id, id));
  revalidatePath("/writers");
  return { ok: "削除しました" };
}

// ---------- 通知設定 ----------

export async function saveSubscriptions(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const notifyAll = fd.get("notifyAll") === "on";
  const artistIds = fd.getAll("artistIds").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ email: user.email, name: user.name, notifyAll })
      .onConflictDoUpdate({ target: users.email, set: { notifyAll } });
    await tx.delete(subscriptions).where(eq(subscriptions.userEmail, user.email));
    if (artistIds.length > 0) {
      await tx.insert(subscriptions).values(artistIds.map((artistId) => ({ userEmail: user.email, artistId })));
    }
  });
  revalidatePath("/settings");
  return { ok: "通知設定を保存しました" };
}
