import { addMonths, startOfMonth } from "./dates";
import { milestonesOf, type MilestoneItem, type MilestoneSource } from "./milestones";

export type BoardItem<R> = MilestoneItem & { release: R };
export type BoardMonth<R> = { month: string; items: BoardItem<R>[] };

/** from(YYYY-MM-DD)の月から months か月分、各マイルストーンを月ごとに日付順で振り分ける */
export function groupByMonth<R extends MilestoneSource>(releases: R[], from: string, months: number): BoardMonth<R>[] {
  const first = startOfMonth(from);
  const cols: BoardMonth<R>[] = Array.from({ length: months }, (_, i) => ({ month: addMonths(first, i).slice(0, 7), items: [] }));
  const index = new Map(cols.map((c) => [c.month, c]));
  for (const r of releases) {
    for (const it of milestonesOf(r)) index.get(it.date.slice(0, 7))?.items.push({ ...it, release: r });
  }
  for (const c of cols) c.items.sort((a, b) => a.date.localeCompare(b.date));
  return cols;
}

export function monthLabel(month: string, withYear = true): string {
  const [y, m] = month.split("-").map(Number);
  return withYear ? `${y}年${m}月` : `${m}月`;
}
