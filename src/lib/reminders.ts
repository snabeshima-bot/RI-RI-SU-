import { MILESTONES, milestonesOf, type MilestoneKey, type MilestoneSource } from "./milestones";

export const REMIND_DAYS_BEFORE = 3;

export type ReminderRelease = MilestoneSource & {
  id: number;
  title: string;
  artistId: number;
  artistName: string;
};

export type DueItem = {
  releaseId: number;
  releaseTitle: string;
  artistId: number;
  artistName: string;
  milestone: MilestoneKey;
  date: string;
};

/** targetDate に該当する未完了のマイルストーンを抽出する(完了済みの入稿は除外) */
export function collectDue(releases: ReminderRelease[], targetDate: string): DueItem[] {
  return releases.flatMap((r) =>
    milestonesOf(r)
      .filter((m) => m.date === targetDate && !m.done)
      .map((m) => ({
        releaseId: r.id,
        releaseTitle: r.title,
        artistId: r.artistId,
        artistName: r.artistName,
        milestone: m.key,
        date: m.date,
      })),
  );
}

export type Subscriber = { email: string; notifyAll: boolean; artistIds: number[] };

/** 購読者ごとに、送るべき項目をまとめる */
export function buildDigests(due: DueItem[], subscribers: Subscriber[]): Map<string, DueItem[]> {
  const digests = new Map<string, DueItem[]>();
  for (const s of subscribers) {
    const items = due.filter((d) => s.notifyAll || s.artistIds.includes(d.artistId));
    if (items.length > 0) digests.set(s.email, items);
  }
  return digests;
}

export function dueKey(d: Pick<DueItem, "releaseId" | "milestone" | "date">): string {
  return `${d.releaseId}:${d.milestone}:${d.date}`;
}

export function describeDue(d: DueItem): string {
  return `${d.artistName}「${d.releaseTitle}」${MILESTONES[d.milestone].label}`;
}
