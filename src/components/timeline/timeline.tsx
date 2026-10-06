"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { MilestoneMarker } from "@/components/milestone-marker";
import { addDays, addMonths, diffDays, formatJa, startOfMonth, weekday } from "@/lib/dates";
import { MILESTONES, milestonesOf, releaseTypeLabel, type MilestoneItem } from "@/lib/milestones";
import type { ReleaseRow } from "@/lib/queries";

const ZOOMS = {
  week: { label: "週", px: 34, months: 4 },
  month: { label: "月", px: 12, months: 8 },
} as const;
type Zoom = keyof typeof ZOOMS;

const LEFT_WIDE = 248;
const LEFT_NARROW = 140;
const ROW_H = 52;

type Hover = { x: number; y: number; release: ReleaseRow; item: MilestoneItem } | null;

export function Timeline({ releases, today }: { releases: ReleaseRow[]; today: string }) {
  const router = useRouter();
  const [zoom, setZoom] = useState<Zoom>("week");
  const [offset, setOffset] = useState(0);
  const [hover, setHover] = useState<Hover>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [leftW, setLeft] = useState(LEFT_WIDE);

  // スマホでは左のリリース名列を細くする
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setLeft(mq.matches ? LEFT_NARROW : LEFT_WIDE);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const { px, months } = ZOOMS[zoom];
  const start = addMonths(startOfMonth(today), offset - 1);
  const end = addDays(addMonths(start, months), -1);
  const days = diffDays(end, start) + 1;
  const width = days * px;
  const xOf = (date: string) => (diffDays(date, start) + 0.5) * px;

  const rows = useMemo(() => {
    return releases
      .map((r) => ({ r, items: milestonesOf(r) }))
      .filter(({ items }) => items.some((i) => i.date >= start && i.date <= end))
      .sort((a, b) => {
        const ka = a.r.release ?? a.items[0]?.date ?? "";
        const kb = b.r.release ?? b.items[0]?.date ?? "";
        return ka.localeCompare(kb) || a.r.id - b.r.id;
      });
  }, [releases, start, end]);

  const monthMarks = useMemo(() => {
    const marks: { date: string; x: number; label: string }[] = [];
    for (let i = 0; i < months; i++) {
      const d = addMonths(start, i);
      const [y, m] = d.split("-").map(Number);
      marks.push({ date: d, x: diffDays(d, start) * px, label: i === 0 || m === 1 ? `${y}年${m}月` : `${m}月` });
    }
    return marks;
  }, [start, months, px]);

  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => addDays(start, i)), [start, days]);
  const todayVisible = today >= start && today <= end;

  // 初回・ズーム変更時に「今日」が左寄りに見えるようスクロール
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const target = todayVisible ? xOf(today) - 120 : 0;
    el.scrollTo({ left: Math.max(0, target), behavior: "instant" as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, offset, leftW]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <div className="flex items-center gap-1">
          <button className="btn-ghost px-2" onClick={() => setOffset((o) => o - 1)} aria-label="前の月">
            ‹
          </button>
          <button className="btn-outline px-3 py-1" onClick={() => setOffset(0)}>
            今日
          </button>
          <button className="btn-ghost px-2" onClick={() => setOffset((o) => o + 1)} aria-label="次の月">
            ›
          </button>
        </div>
        <span className="text-sm font-semibold text-slate-700">
          {formatJa(start, true)} 〜 {formatJa(end, true)}
        </span>
        <div className="ml-auto inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
          {(Object.keys(ZOOMS) as Zoom[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={clsx("rounded-md px-3 py-1 font-medium", zoom === z ? "bg-white shadow-sm" : "text-slate-500")}
            >
              {ZOOMS[z].label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scroller} className="relative overflow-x-auto" onScroll={() => setHover(null)}>
        <div className="relative" style={{ width: leftW + width }}>
          {/* ヘッダー */}
          <div className="sticky top-0 z-20 flex border-b border-slate-200 bg-white">
            <div className="sticky left-0 z-30 flex shrink-0 items-end border-r border-slate-200 bg-white px-4 pb-1.5 text-xs font-semibold text-slate-500" style={{ width: leftW }}>
              リリース
            </div>
            <div className="relative h-12" style={{ width }}>
              {monthMarks.map((m, i) => (
                <div
                  key={m.date}
                  className="absolute top-0 h-full border-l border-slate-200"
                  style={{ left: m.x, width: (monthMarks[i + 1]?.x ?? width) - m.x }}
                >
                  {/* スクロールしても月名が左端に残るよう sticky にする */}
                  <span className="sticky inline-block whitespace-nowrap pl-1.5 pt-1 text-xs font-bold text-slate-700" style={{ left: leftW }}>
                    {m.label}
                  </span>
                </div>
              ))}
              {dayList.map((d) => {
                const w = weekday(d);
                const show = px >= 20 || w === 1;
                if (!show) return null;
                return (
                  <div
                    key={d}
                    className={clsx(
                      "absolute bottom-1 text-center text-[10px] tabular-nums",
                      d === today ? "font-bold text-red-600" : w === 0 ? "text-red-400" : w === 6 ? "text-sky-500" : "text-slate-400",
                    )}
                    style={{ left: diffDays(d, start) * px, width: px }}
                  >
                    {Number(d.slice(8))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 背景(週末・月境界・今日線) */}
          <div className="pointer-events-none absolute bottom-0 top-12" style={{ left: leftW, width }}>
            {px >= 20 &&
              dayList
                .filter((d) => weekday(d) === 0 || weekday(d) === 6)
                .map((d) => <div key={d} className="absolute inset-y-0 bg-slate-50" style={{ left: diffDays(d, start) * px, width: px }} />)}
            {monthMarks.map((m) => (
              <div key={m.date} className="absolute inset-y-0 border-l border-slate-200" style={{ left: m.x }} />
            ))}
            {todayVisible && (
              <div className="absolute inset-y-0 z-10 w-0.5 bg-red-500/70" style={{ left: xOf(today) - 1 }}>
                <span className="absolute -top-0.5 left-1 whitespace-nowrap rounded bg-red-500 px-1 text-[10px] font-bold text-white">今日</span>
              </div>
            )}
          </div>

          {/* 行 */}
          {rows.length === 0 && (
            <div className="sticky left-0 px-4 py-16 text-center text-sm text-slate-400" style={{ width: "min(100vw - 2rem, 1366px)" }}>
              この期間に予定はありません
            </div>
          )}
          {rows.map(({ r, items }) => {
            const inRange = items.map((i) => i.date);
            const minX = Math.max(0, xOf(inRange.reduce((a, b) => (a < b ? a : b))));
            const maxX = Math.min(width, xOf(inRange.reduce((a, b) => (a > b ? a : b))));
            return (
              <div key={r.id} className="group relative flex border-b border-slate-100 hover:bg-indigo-50/30" style={{ height: ROW_H }}>
                <Link
                  href={`/releases/${r.id}`}
                  className="sticky left-0 z-10 flex shrink-0 items-center gap-2.5 border-r border-slate-200 bg-white px-3 group-hover:bg-indigo-50/60"
                  style={{ width: leftW }}
                >
                  <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: r.artistColor }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold leading-tight">{r.title}</span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {r.artistName} · {releaseTypeLabel(r.type)}
                      {r.release && <> · {formatJa(r.release)}</>}
                    </span>
                  </span>
                </Link>
                <div className="relative" style={{ width }}>
                  {maxX > minX && (
                    <div
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                      style={{ left: minX, width: maxX - minX, backgroundColor: r.artistColor, opacity: 0.22 }}
                    />
                  )}
                  {items.map((it) => {
                    if (it.date < start || it.date > end) return null;
                    const m = MILESTONES[it.key];
                    const overdue = m.kind === "submission" && !it.done && it.date < today;
                    return (
                      <button
                        key={it.key}
                        className="absolute top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 rounded-full p-1 transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        style={{ left: xOf(it.date) }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHover({ x: rect.left + rect.width / 2, y: rect.top, release: r, item: it });
                        }}
                        onMouseLeave={() => setHover(null)}
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHover({ x: rect.left + rect.width / 2, y: rect.top, release: r, item: it });
                        }}
                        onBlur={() => setHover(null)}
                        onClick={() => router.push(`/releases/${r.id}`)}
                        aria-label={`${m.label} ${formatJa(it.date)}`}
                      >
                        <MilestoneMarker milestone={it.key} done={it.done} overdue={overdue} size={m.kind === "release" ? 18 : 15} />
                      </button>
                    );
                  })}
                  {px >= 20 &&
                    items
                      .filter((it) => it.key === "release" && it.date >= start && it.date <= end)
                      .map((it) => (
                        <span
                          key="label"
                          className="pointer-events-none absolute bottom-0.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold"
                          style={{ left: xOf(it.date), color: MILESTONES.release.color }}
                        >
                          {formatJa(it.date)}
                        </span>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hover && <Tooltip hover={hover} today={today} />}
    </div>
  );
}

function Tooltip({ hover, today }: { hover: NonNullable<Hover>; today: string }) {
  const m = MILESTONES[hover.item.key];
  const days = diffDays(hover.item.date, today);
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: hover.x, top: hover.y - 8 }}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
        {m.label}
      </div>
      <div className="mt-0.5 text-sm font-bold">
        {formatJa(hover.item.date, true)}
        <span className="ml-1.5 text-xs font-normal text-slate-300">
          {days === 0 ? "今日" : days > 0 ? `あと${days}日` : `${-days}日前`}
          {m.doneKey && (hover.item.done ? " · 入稿済み" : " · 未入稿")}
        </span>
      </div>
      <div className="mt-0.5 text-slate-300">
        {hover.release.artistName}「{hover.release.title}」
      </div>
    </div>
  );
}
