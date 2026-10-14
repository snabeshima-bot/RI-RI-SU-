import "server-only";
import { asc, count, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { emptyCredits, isCreditRole } from "./credits";
import type { MilestoneSource } from "./milestones";

const { artists, releases, tracks, trackCredits, writers } = schema;

export type ReleaseRow = MilestoneSource & {
  id: number;
  title: string;
  type: string;
  artistId: number;
  artistName: string;
  artistColor: string;
  trackCount: number;
  /** 作曲者名(収録曲全体、重複なし) */
  composers: string[];
};

export async function listArtists() {
  return getDb().select().from(artists).orderBy(asc(artists.sortOrder), asc(artists.id));
}

export async function listReleases(artistId?: number): Promise<ReleaseRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: releases.id,
      title: releases.title,
      type: releases.type,
      artistId: releases.artistId,
      artistName: artists.name,
      artistColor: artists.color,
      release: releases.release,
      musicSubmission: releases.musicSubmission,
      jacketSubmission: releases.jacketSubmission,
      karaokeRelease: releases.karaokeRelease,
      karaokeSubmission: releases.karaokeSubmission,
      demoDeadline: releases.demoDeadline,
      recording: releases.recording,
      utawariFix: releases.utawariFix,
      firstPerformance: releases.firstPerformance,
      liveDeadline: releases.liveDeadline,
      masterDeadline: releases.masterDeadline,
      teaserShoot: releases.teaserShoot,
      teaserRelease: releases.teaserRelease,
      demoSubmitted: releases.demoSubmitted,
      utawariFixed: releases.utawariFixed,
      liveSubmitted: releases.liveSubmitted,
      masterSubmitted: releases.masterSubmitted,
      musicSubmitted: releases.musicSubmitted,
      jacketSubmitted: releases.jacketSubmitted,
      karaokeSubmitted: releases.karaokeSubmitted,
    })
    .from(releases)
    .innerJoin(artists, eq(artists.id, releases.artistId))
    .where(artistId ? eq(releases.artistId, artistId) : undefined)
    .orderBy(asc(releases.release), asc(releases.id));

  const counts = await db
    .select({ releaseId: tracks.releaseId, n: count() })
    .from(tracks)
    .groupBy(tracks.releaseId);
  const countMap = new Map(counts.map((c) => [c.releaseId, c.n]));

  const composerRows = await db
    .select({ releaseId: tracks.releaseId, name: writers.name })
    .from(trackCredits)
    .innerJoin(tracks, eq(tracks.id, trackCredits.trackId))
    .innerJoin(writers, eq(writers.id, trackCredits.writerId))
    .where(eq(trackCredits.role, "composition"))
    .orderBy(asc(tracks.trackNo), asc(trackCredits.sortOrder));
  const composerMap = new Map<number, string[]>();
  for (const c of composerRows) {
    const list = composerMap.get(c.releaseId) ?? [];
    if (!list.includes(c.name)) list.push(c.name);
    composerMap.set(c.releaseId, list);
  }
  return rows.map((r) => ({ ...r, trackCount: countMap.get(r.id) ?? 0, composers: composerMap.get(r.id) ?? [] }));
}

export async function getRelease(id: number) {
  const db = getDb();
  const [release] = await db.select().from(releases).where(eq(releases.id, id));
  if (!release) return null;
  const trackRows = await db
    .select()
    .from(tracks)
    .where(eq(tracks.releaseId, id))
    .orderBy(asc(tracks.trackNo));
  const creditRows = trackRows.length
    ? await db
        .select()
        .from(trackCredits)
        .where(
          inArray(
            trackCredits.trackId,
            trackRows.map((t) => t.id),
          ),
        )
        .orderBy(asc(trackCredits.sortOrder))
    : [];
  const withCredits = trackRows.map((t) => {
    const credits = emptyCredits();
    for (const c of creditRows) if (c.trackId === t.id && isCreditRole(c.role)) credits[c.role].push(c.writerId);
    return { ...t, credits };
  });
  return { release, tracks: withCredits };
}

export async function listWriters() {
  const db = getDb();
  const [rows, usage] = await Promise.all([
    db.select().from(writers).orderBy(asc(writers.name)),
    db
      .select({ writerId: trackCredits.writerId, n: count() })
      .from(trackCredits)
      .groupBy(trackCredits.writerId),
  ]);
  const usageMap = new Map(usage.map((u) => [u.writerId, u.n]));
  return rows.map((w) => ({ ...w, creditCount: usageMap.get(w.id) ?? 0 }));
}
