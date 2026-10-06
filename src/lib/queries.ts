import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { MilestoneSource } from "./milestones";

const { artists, releases, tracks } = schema;

export type ReleaseRow = MilestoneSource & {
  id: number;
  title: string;
  type: string;
  artistId: number;
  artistName: string;
  artistColor: string;
  trackCount: number;
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
      teaserShoot: releases.teaserShoot,
      teaserRelease: releases.teaserRelease,
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
  return rows.map((r) => ({ ...r, trackCount: countMap.get(r.id) ?? 0 }));
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
  return { release, tracks: trackRows };
}
