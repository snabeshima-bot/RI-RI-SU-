import Link from "next/link";
import clsx from "clsx";
import { DaysBadge, MilestoneMarker } from "@/components/milestone-marker";
import { groupByMonth, monthLabel, type BoardItem } from "@/lib/board";
import { addMonths, diffDays, formatJa, startOfMonth } from "@/lib/dates";
import { MILESTONES } from "@/lib/milestones";
import type { ReleaseRow } from "@/lib/queries";

const MONTHS = 6;

export function MonthBoard({
  releases,
  today,
  from,
  hrefForMonth,
}: {
  releases: ReleaseRow[];
  today: string;
  from: string;
  hrefForMonth: (month: string) => string;
}) {
  const first = startOfMonth(from);
  const cols = groupByMonth(releases, first, MONTHS);
  const thisMonth = today.slice(0, 7);

  return (
    <div className="space-y-3">
      <MonthNav first={first} months={MONTHS} today={today} hrefForMonth={hrefForMonth} />
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3">
        {cols.map((col) => {
          const isCurrent = col.month === thisMonth;
          const pastCount = isCurrent ? col.items.filter((i) => i.date < today).length : 0;
          return (
            <section
              key={col.month}
              className={clsx(
                "flex w-[300px] shrink-0 snap-start flex-col rounded-2xl border",
                isCurrent ? "border-indigo-300 bg-indigo-50/60 shadow-sm" : "border-slate-200 bg-slate-100/70",
              )}
            >
              <header className="flex items-baseline justify-between px-4 pb-2 pt-3">
                <h3 className={clsx("text-lg font-bold", isCurrent && "text-indigo-700")}>
                  {monthLabel(col.month)}
                  {isCurrent && <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 align-middle text-[11px] font-bold text-white">今月</span>}
                </h3>
                <span className="text-sm text-slate-500">{col.items.length}件</span>
              </header>
              <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
                {col.items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">予定なし</p>}
                {col.items.map((it, i) => (
                  <div key={`${it.release.id}-${it.key}`} className="contents">
                    {isCurrent && i === pastCount && pastCount > 0 && <TodayDivider />}
                    <BoardCard item={it} today={today} />
                  </div>
                ))}
                {isCurrent && pastCount === col.items.length && pastCount > 0 && <TodayDivider />}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TodayDivider() {
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs font-bold text-red-600">
      <span className="h-0.5 flex-1 rounded bg-red-500" />
      今日
      <span className="h-0.5 flex-1 rounded bg-red-500" />
    </div>
  );
}

function BoardCard({ item, today }: { item: BoardItem<ReleaseRow>; today: string }) {
  const m = MILESTONES[item.key];
  const r = item.release;
  const days = diffDays(item.date, today);
  const past = days < 0;
  const overdue = past && m.kind === "submission" && !item.done;
  const faded = item.done || (past && !overdue);

  return (
    <Link
      href={`/releases/${r.id}`}
      className={clsx(
        "group relative block overflow-hidden rounded-xl border bg-white pl-4 pr-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        overdue ? "border-red-400 ring-2 ring-red-100" : "border-slate-200",
        faded && "opacity-55",
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: r.artistColor }} />
      <span
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-bold text-white"
        style={{ backgroundColor: m.color }}
      >
        <MilestoneMarker milestone={item.key} size={11} className="[&>span:first-child]:!border-white [&>span:first-child]:!bg-white" />
        {m.label.replace(/日$/, "")}
      </span>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-lg font-bold tabular-nums">{formatJa(item.date)}</span>
        {item.done ? (
          <span className="text-xs font-semibold text-emerald-600">✓ 入稿済み</span>
        ) : (
          (!past || overdue) && <DaysBadge days={days} />
        )}
      </div>
      <div className="mt-0.5 truncate text-[15px] font-semibold text-slate-900 group-hover:text-indigo-700">{r.title}</div>
      <div className="truncate text-xs text-slate-500">{r.artistName}</div>
    </Link>
  );
}

export function MonthNav({
  first,
  months,
  today,
  hrefForMonth,
}: {
  first: string;
  months: number;
  today: string;
  hrefForMonth: (month: string) => string;
}) {
  const last = addMonths(first, months - 1).slice(0, 7);
  return (
    <div className="flex items-center gap-2">
      <Link href={hrefForMonth(addMonths(first, -1).slice(0, 7))} scroll={false} className="btn-outline px-3 py-1.5" aria-label="前の月">
        ‹
      </Link>
      <Link href={hrefForMonth(today.slice(0, 7))} scroll={false} className="btn-outline px-3 py-1.5">
        今月
      </Link>
      <Link href={hrefForMonth(addMonths(first, 1).slice(0, 7))} scroll={false} className="btn-outline px-3 py-1.5" aria-label="次の月">
        ›
      </Link>
      <span className="ml-1 text-sm font-semibold text-slate-600">
        {monthLabel(first.slice(0, 7))} 〜 {monthLabel(last)}
      </span>
    </div>
  );
}
