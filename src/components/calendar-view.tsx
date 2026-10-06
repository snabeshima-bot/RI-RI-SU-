import Link from "next/link";
import clsx from "clsx";
import { MilestoneMarker } from "@/components/milestone-marker";
import { addDays, addMonths, daysInMonth, startOfMonth, weekday, weekdayLabel } from "@/lib/dates";
import { MILESTONES, milestonesOf } from "@/lib/milestones";
import type { ReleaseRow } from "@/lib/queries";

export function CalendarView({
  releases,
  today,
  month,
  hrefForMonth,
}: {
  releases: ReleaseRow[];
  today: string;
  month: string;
  hrefForMonth: (month: string) => string;
}) {
  const first = startOfMonth(month);
  const gridStart = addDays(first, -weekday(first));
  const weeks = Math.ceil((weekday(first) + daysInMonth(first)) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));

  const byDate = new Map<string, { r: ReleaseRow; key: keyof typeof MILESTONES; done: boolean }[]>();
  for (const r of releases) {
    for (const it of milestonesOf(r)) {
      const list = byDate.get(it.date) ?? [];
      list.push({ r, key: it.key, done: it.done });
      byDate.set(it.date, list);
    }
  }
  const [y, m] = first.split("-").map(Number);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <Link href={hrefForMonth(addMonths(first, -1).slice(0, 7))} scroll={false} className="btn-ghost px-2">
          ‹
        </Link>
        <Link href={hrefForMonth(today.slice(0, 7))} scroll={false} className="btn-outline px-3 py-1">
          今月
        </Link>
        <Link href={hrefForMonth(addMonths(first, 1).slice(0, 7))} scroll={false} className="btn-ghost px-2">
          ›
        </Link>
        <span className="text-base font-bold">
          {y}年{m}月
        </span>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={clsx("py-1.5", i === 0 ? "text-red-500" : i === 6 ? "text-sky-600" : "text-slate-500")}>
            {weekdayLabel(i)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const inMonth = d.slice(0, 7) === first.slice(0, 7);
          const list = byDate.get(d) ?? [];
          return (
            <div key={d} className={clsx("min-h-[110px] border-b border-r border-slate-100 p-1.5", !inMonth && "bg-slate-50/70")}>
              <div
                className={clsx(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums",
                  d === today ? "bg-red-500 font-bold text-white" : inMonth ? "text-slate-700" : "text-slate-300",
                )}
              >
                {Number(d.slice(8))}
              </div>
              <div className="space-y-1">
                {list.map(({ r, key, done }) => {
                  const ms = MILESTONES[key];
                  return (
                    <Link
                      key={`${r.id}-${key}`}
                      href={`/releases/${r.id}`}
                      title={`${ms.label}:${r.artistName}「${r.title}」`}
                      className={clsx("flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight hover:brightness-95", done && "opacity-50")}
                      style={{ backgroundColor: ms.soft }}
                    >
                      <MilestoneMarker milestone={key} done={done} size={10} />
                      <span className="shrink-0 font-semibold" style={{ color: ms.color }}>
                        {ms.short}
                      </span>
                      <span className="truncate text-slate-700">{r.title}</span>
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: r.artistColor }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
