import Link from "next/link";
import clsx from "clsx";
import { DaysBadge, MilestoneMarker } from "@/components/milestone-marker";
import { monthLabel } from "@/lib/board";
import { diffDays, formatJa, weekday, weekdayLabel } from "@/lib/dates";
import { MILESTONES } from "@/lib/milestones";
import type { ReleaseRow } from "@/lib/queries";
import { buildTimeline, TIMELINE_PAST_DAYS, type TimelineDay, type TimelineEntry } from "@/lib/timeline";

export function VerticalTimeline({
  releases,
  today,
  showPast,
  togglePastHref,
}: {
  releases: ReleaseRow[];
  today: string;
  showPast: boolean;
  togglePastHref: string;
}) {
  const months = buildTimeline(releases, today, showPast);
  const days = months.flatMap((m) => m.days);
  // 「今日」の線は、今日以降で最初の日の直前に入れる(全部過去なら最後)
  const todayBefore = days.find((d) => d.date >= today)?.date ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex justify-end">
        <Link href={togglePastHref} scroll={false} className="text-sm text-slate-500 hover:text-slate-800">
          {showPast ? "✓ 過去の予定も表示中" : `過去の予定も表示(今は${TIMELINE_PAST_DAYS}日前から)`}
        </Link>
      </div>
      {months.length === 0 && <div className="card py-16 text-center text-slate-400">予定がありません</div>}
      {months.map((m) => (
        <section key={m.month} className="relative">
          <h3 className="sticky top-14 z-20 -mx-2 mb-2 bg-slate-50/95 px-2 py-2 text-xl font-bold backdrop-blur">
            {monthLabel(m.month)}
            {m.month === today.slice(0, 7) && <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 align-middle text-xs text-white">今月</span>}
          </h3>
          <ol className="relative">
            {/* 縦線 */}
            <span className="absolute bottom-0 top-0 left-[87px] w-0.5 bg-slate-200 sm:left-[115px]" aria-hidden />
            {m.days.map((d) => (
              <li key={d.date}>
                {d.date === todayBefore && <TodayLine />}
                <DayRow day={d} today={today} />
              </li>
            ))}
          </ol>
        </section>
      ))}
      {todayBefore === null && months.length > 0 && <TodayLine />}
    </div>
  );
}

function TodayLine() {
  return (
    <div className="relative z-10 my-3 flex items-center gap-3 sm:gap-4">
      <span className="w-[64px] text-right text-sm font-bold text-red-600 sm:w-[88px]">今日</span>
      <span className="flex w-6 shrink-0 justify-center">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500 shadow" />
      </span>
      <span className="-ml-3 h-0.5 flex-1 bg-red-500" />
    </div>
  );
}

function DayRow({ day, today }: { day: TimelineDay<ReleaseRow>; today: string }) {
  const past = day.date < today;
  const isToday = day.date === today;
  const w = weekday(day.date);
  return (
    <div className="flex gap-3 py-2 sm:gap-4">
      <div className="w-[64px] shrink-0 pt-2 text-right sm:w-[88px]">
        <div className={clsx("text-xl font-bold tabular-nums leading-none sm:text-2xl", isToday && "text-red-600", past && "text-slate-400")}>
          {Number(day.date.slice(5, 7))}/{Number(day.date.slice(8))}
        </div>
        <div className={clsx("mt-1 text-xs font-semibold", w === 0 ? "text-red-500" : w === 6 ? "text-sky-600" : "text-slate-500")}>
          {weekdayLabel(w)}曜日
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {day.entries.map((e) => (
          <EntryRow key={`${e.release.id}-${e.key}`} entry={e} today={today} />
        ))}
      </div>
    </div>
  );
}

function EntryRow({ entry, today }: { entry: TimelineEntry<ReleaseRow>; today: string }) {
  const m = MILESTONES[entry.key];
  const r = entry.release;
  const days = diffDays(entry.date, today);
  const overdue = days < 0 && m.kind === "submission" && !entry.done;
  const isRelease = entry.key === "release";

  return (
    <div className={clsx("relative flex items-start gap-3", days < 0 && !overdue && "opacity-55")}>
      {/* 縦線上の印 */}
      <span className="relative z-10 mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
        <MilestoneMarker milestone={entry.key} done={entry.done} overdue={overdue} size={isRelease ? 16 : 13} />
      </span>
      <Link
        href={`/releases/${r.id}`}
        className={clsx(
          "relative min-w-0 flex-1 overflow-hidden rounded-xl border py-2.5 pl-4 pr-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
          isRelease ? "border-transparent text-white" : "bg-white",
          overdue ? "border-red-400 ring-2 ring-red-100" : !isRelease && "border-slate-200",
        )}
        style={isRelease ? { backgroundColor: m.color } : undefined}
      >
        {!isRelease && <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: r.artistColor }} />}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={clsx("rounded-md px-2 py-0.5 text-[13px] font-bold", isRelease ? "bg-white/20" : "text-white")}
            style={isRelease ? undefined : { backgroundColor: m.color }}
          >
            {isRelease && "★ "}
            {m.label.replace(/日$/, "")}
          </span>
          {entry.done ? (
            <span className="text-xs font-semibold text-emerald-600">✓ 入稿済み</span>
          ) : (
            (days >= 0 || overdue) && <DaysBadge days={days} />
          )}
        </div>
        <div className={clsx("mt-1 truncate text-base font-bold", !isRelease && "text-slate-900")}>{r.title}</div>
        <div className={clsx("flex items-center gap-1.5 text-xs", isRelease ? "text-white/85" : "text-slate-500")}>
          <span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ backgroundColor: r.artistColor }} />
          {r.artistName}
          <span className="sr-only">{formatJa(entry.date, true)}</span>
        </div>
      </Link>
    </div>
  );
}
