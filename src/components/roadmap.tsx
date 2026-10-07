import Link from "next/link";
import clsx from "clsx";
import { DaysBadge, MilestoneMarker } from "@/components/milestone-marker";
import { addDays, diffDays, formatJa } from "@/lib/dates";
import { MILESTONES, releaseTypeLabel } from "@/lib/milestones";
import { PHASES, releasePhase, releaseSteps, type Phase } from "@/lib/phase";
import type { ReleaseRow } from "@/lib/queries";

const RELEASED_RECENT_DAYS = 90;

const PHASE_STYLE: Record<Phase, { head: string; dot: string }> = {
  unscheduled: { head: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  production: { head: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  waiting: { head: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500" },
  released: { head: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
};

export function Roadmap({
  releases,
  today,
  showAll,
  toggleAllHref,
}: {
  releases: ReleaseRow[];
  today: string;
  showAll: boolean;
  toggleAllHref: string;
}) {
  const since = addDays(today, -RELEASED_RECENT_DAYS);
  const columns = PHASES.map((p) => ({
    ...p,
    items: releases
      .filter((r) => releasePhase(r, today) === p.key)
      .filter((r) => p.key !== "released" || showAll || (r.release ?? "") >= since)
      .sort((a, b) =>
        p.key === "released" ? (b.release ?? "").localeCompare(a.release ?? "") : (a.release ?? "").localeCompare(b.release ?? ""),
      ),
  }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <span>入稿の完了は、各リリースの編集画面の「入稿済み」チェックで判定します。</span>
        <Link href={toggleAllHref} scroll={false} className="hover:text-slate-800">
          {showAll ? "✓ リリース済みをすべて表示中" : `リリース済みをすべて表示(今は直近${RELEASED_RECENT_DAYS}日)`}
        </Link>
      </div>
      <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[300px] grid-flow-col gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid-flow-row lg:grid-cols-4 lg:px-0">
        {columns.map((col) => (
          <section key={col.key} className="flex snap-start flex-col rounded-2xl border border-slate-200 bg-slate-100/70">
            <header className={clsx("flex items-center justify-between rounded-t-2xl px-4 py-3", PHASE_STYLE[col.key].head)}>
              <h3 className="flex items-center gap-2 text-base font-bold">
                <span className={clsx("h-2.5 w-2.5 rounded-full", PHASE_STYLE[col.key].dot)} />
                {col.label}
              </h3>
              <span className="text-sm font-semibold">{col.items.length}件</span>
            </header>
            <div className="flex flex-1 flex-col gap-3 p-3">
              {col.items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">なし</p>}
              {col.items.map((r) => (
                <RoadmapCard key={r.id} release={r} today={today} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function RoadmapCard({ release: r, today }: { release: ReleaseRow; today: string }) {
  const steps = releaseSteps(r, today);
  const next = steps.find((s) => s.state === "next");
  const doneCount = steps.filter((s) => s.state === "done").length;

  return (
    <Link
      href={`/releases/${r.id}`}
      className="relative block overflow-hidden rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: r.artistColor }} />
      <div className="text-base font-bold leading-snug">{r.title}</div>
      <div className="text-xs text-slate-500">
        {r.artistName} · {releaseTypeLabel(r.type)}
      </div>
      {r.release && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-indigo-700">★ {formatJa(r.release, true)}</span>
          {r.release >= today && <DaysBadge days={diffDays(r.release, today)} />}
        </div>
      )}

      {steps.length > 0 && (
        <>
          <div className="mt-3 flex items-center gap-1" aria-label={`工程 ${doneCount}/${steps.length} 完了`}>
            {steps.map((s) => (
              <span
                key={s.key}
                title={`${MILESTONES[s.key].label} ${formatJa(s.date)}${s.state === "done" ? "(完了)" : ""}`}
                className={clsx(
                  "h-2 flex-1 rounded-full",
                  s.state === "done" ? "" : s.state === "next" ? "ring-2 ring-offset-1" : "bg-slate-200",
                )}
                style={
                  s.state === "done"
                    ? { backgroundColor: MILESTONES[s.key].color }
                    : s.state === "next"
                      ? { backgroundColor: MILESTONES[s.key].soft, ["--tw-ring-color" as string]: MILESTONES[s.key].color }
                      : undefined
                }
              />
            ))}
          </div>
          <ol className="mt-2 space-y-1">
            {steps.map((s) => (
              <li
                key={s.key}
                className={clsx(
                  "flex items-center gap-2 text-xs",
                  s.state === "done" && "text-slate-400",
                  s.state === "next" && "font-bold text-slate-900",
                  s.state === "todo" && "text-slate-600",
                )}
              >
                <span className="w-3 text-center">{s.state === "done" ? "✓" : ""}</span>
                <MilestoneMarker milestone={s.key} size={10} done={s.state === "done"} />
                <span className={clsx("flex-1", s.state === "done" && "line-through")}>{MILESTONES[s.key].short}</span>
                <span className="tabular-nums">{formatJa(s.date)}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {next && (
        <div className="mt-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ backgroundColor: MILESTONES[next.key].soft, color: MILESTONES[next.key].color }}>
          次:{MILESTONES[next.key].label.replace(/日$/, "")} {formatJa(next.date)}
          <span className="ml-auto">
            <DaysBadge days={diffDays(next.date, today)} />
          </span>
        </div>
      )}
    </Link>
  );
}
