import Link from "next/link";
import { DaysBadge, MilestoneMarker } from "@/components/milestone-marker";
import { diffDays, formatJa } from "@/lib/dates";
import { MILESTONES, milestonesOf } from "@/lib/milestones";
import type { ReleaseRow } from "@/lib/queries";

const HORIZON = 14;

/** 期限超過の未入稿 + 今後14日以内の予定 */
export function Upcoming({ releases, today }: { releases: ReleaseRow[]; today: string }) {
  const items = releases
    .flatMap((r) => milestonesOf(r).map((it) => ({ r, it, days: diffDays(it.date, today) })))
    .filter(({ it, days }) => {
      const m = MILESTONES[it.key];
      if (it.done) return false;
      if (days < 0) return m.kind === "submission";
      return days <= HORIZON;
    })
    .sort((a, b) => a.it.date.localeCompare(b.it.date));

  const overdue = items.filter((i) => i.days < 0).length;

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-bold">直近の予定</h2>
        <span className="text-xs text-slate-500">
          {HORIZON}日以内
          {overdue > 0 && <span className="ml-2 font-semibold text-red-600">超過 {overdue}件</span>}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">直近の予定はありません 🎉</p>
      ) : (
        <ul className="-mx-2 max-h-[340px] space-y-0.5 overflow-y-auto">
          {items.map(({ r, it, days }) => {
            const m = MILESTONES[it.key];
            return (
              <li key={`${r.id}-${it.key}`}>
                <Link href={`/releases/${r.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <MilestoneMarker milestone={it.key} overdue={days < 0} size={14} />
                  <span className="w-[4.5rem] shrink-0 text-sm font-semibold tabular-nums">{formatJa(it.date)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      <span className="font-semibold" style={{ color: m.color }}>
                        {m.short}
                      </span>{" "}
                      {r.title}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.artistColor }} />
                      {r.artistName}
                    </span>
                  </span>
                  <DaysBadge days={days} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
