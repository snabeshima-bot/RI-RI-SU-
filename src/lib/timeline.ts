import { addDays } from "./dates";
import { milestonesOf, type MilestoneItem, type MilestoneSource } from "./milestones";

export const TIMELINE_PAST_DAYS = 14;

export type TimelineEntry<R> = MilestoneItem & { release: R };
export type TimelineDay<R> = { date: string; entries: TimelineEntry<R>[] };
export type TimelineMonth<R> = { month: string; days: TimelineDay<R>[] };

/** 予定を 月 → 日 → 予定 にまとめる。showPast=false なら今日の14日前より古いものは除く */
export function buildTimeline<R extends MilestoneSource>(releases: R[], today: string, showPast: boolean): TimelineMonth<R>[] {
  const since = showPast ? "" : addDays(today, -TIMELINE_PAST_DAYS);
  const entries = releases
    .flatMap((r) => milestonesOf(r).map((it) => ({ ...it, release: r })))
    .filter((e) => e.date >= since)
    .sort((a, b) => a.date.localeCompare(b.date));

  const months: TimelineMonth<R>[] = [];
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    let m = months.at(-1);
    if (!m || m.month !== month) months.push((m = { month, days: [] }));
    let d = m.days.at(-1);
    if (!d || d.date !== e.date) m.days.push((d = { date: e.date, entries: [] }));
    d.entries.push(e);
  }
  return months;
}
