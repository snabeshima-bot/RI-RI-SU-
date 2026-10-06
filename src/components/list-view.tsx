import Link from "next/link";
import clsx from "clsx";
import { DaysBadge, MilestoneMarker } from "@/components/milestone-marker";
import { diffDays, formatJa } from "@/lib/dates";
import { MILESTONE_LIST, releaseTypeLabel } from "@/lib/milestones";
import type { ReleaseRow } from "@/lib/queries";

export function ListView({ releases, today, showPast }: { releases: ReleaseRow[]; today: string; showPast: boolean }) {
  const rows = releases
    .filter((r) => showPast || MILESTONE_LIST.some((m) => (r[m.key] ?? "") >= today) || !r.release)
    .sort((a, b) => (a.release ?? "9999").localeCompare(b.release ?? "9999"));

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[1180px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <th className="px-4 py-2.5 font-semibold">リリース</th>
            {MILESTONE_LIST.map((m) => (
              <th key={m.key} className="px-3 py-2.5 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <MilestoneMarker milestone={m.key} size={10} />
                  {m.short}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-400">
                リリースがありません
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-2.5">
                <Link href={`/releases/${r.id}`} className="flex items-center gap-2.5">
                  <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: r.artistColor }} />
                  <span>
                    <span className="block font-semibold hover:text-indigo-600">{r.title}</span>
                    <span className="text-xs text-slate-500">
                      {r.artistName} · {releaseTypeLabel(r.type)}
                      {r.trackCount > 0 && ` · ${r.trackCount}曲`}
                    </span>
                  </span>
                </Link>
              </td>
              {MILESTONE_LIST.map((m) => {
                const date = r[m.key];
                const done = m.doneKey ? r[m.doneKey] : false;
                if (!date) return <td key={m.key} className="px-3 py-2.5 text-slate-300">—</td>;
                const days = diffDays(date, today);
                const past = days < 0 && (m.kind !== "submission" || done);
                return (
                  <td key={m.key} className="px-3 py-2.5">
                    <div className={clsx("font-semibold tabular-nums", past && "text-slate-400")}>{formatJa(date)}</div>
                    {!past && <DaysBadge days={days} done={done} />}
                    {past && done && <DaysBadge days={days} done />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
