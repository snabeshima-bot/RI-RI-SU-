import Link from "next/link";
import clsx from "clsx";
import { MonthNav } from "@/components/month-board";
import type { Artist } from "@/db/schema";
import { monthLabel } from "@/lib/board";
import { addMonths, formatJa, startOfMonth } from "@/lib/dates";
import { MILESTONES } from "@/lib/milestones";
import type { ReleaseRow } from "@/lib/queries";

const MONTHS = 12;

type Pill = { r: ReleaseRow; date: string; karaoke: boolean };

export function Roadmap({
  artists,
  releases,
  today,
  from,
  hrefForMonth,
}: {
  artists: Artist[];
  releases: ReleaseRow[];
  today: string;
  from: string;
  hrefForMonth: (month: string) => string;
}) {
  const first = startOfMonth(from);
  const months = Array.from({ length: MONTHS }, (_, i) => addMonths(first, i).slice(0, 7));
  const thisMonth = today.slice(0, 7);
  const rowArtists = artists.filter((a) => releases.some((r) => r.artistId === a.id));

  // アーティスト → 月 → リリース(楽曲リリース+カラオケ配信)
  const cells = new Map<string, Pill[]>();
  for (const r of releases) {
    const add = (date: string | null, karaoke: boolean) => {
      if (!date) return;
      const key = `${r.artistId}:${date.slice(0, 7)}`;
      const list = cells.get(key) ?? [];
      list.push({ r, date, karaoke });
      cells.set(key, list);
    };
    add(r.release, false);
    add(r.karaokeRelease, true);
  }
  for (const list of cells.values()) list.sort((a, b) => a.date.localeCompare(b.date) || Number(a.karaoke) - Number(b.karaoke));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNav first={first} months={MONTHS} today={today} hrefForMonth={hrefForMonth} />
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-5 rounded bg-slate-700" />
            楽曲リリース
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-5 rounded border-2" style={{ borderColor: MILESTONES.karaokeRelease.color }} />
            カラオケ配信
          </span>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1900px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-48" />
            {months.map((m) => (
              <col key={m} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-500">
                アーティスト
              </th>
              {months.map((m, i) => (
                <th
                  key={m}
                  className={clsx(
                    "border-b border-slate-200 px-2 py-3 text-center font-bold",
                    m === thisMonth ? "bg-indigo-600 text-white" : "text-slate-700",
                    i > 0 && m.endsWith("-01") && "border-l-2 border-l-slate-300",
                  )}
                >
                  {i === 0 || m.endsWith("-01") ? monthLabel(m) : monthLabel(m, false)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowArtists.length === 0 && (
              <tr>
                <td colSpan={MONTHS + 1} className="py-12 text-center text-slate-400">
                  リリースがありません
                </td>
              </tr>
            )}
            {rowArtists.map((a) => (
              <tr key={a.id} className="border-b border-slate-100">
                <th className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 text-left align-top">
                  <Link href={`/?artist=${a.id}&view=roadmap`} className="flex items-center gap-2 font-bold hover:text-indigo-700">
                    <span className="h-5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
                    <span>{a.name}</span>
                  </Link>
                </th>
                {months.map((m, i) => (
                  <td
                    key={m}
                    className={clsx(
                      "px-1.5 py-2 align-top",
                      m === thisMonth && "bg-indigo-50/70",
                      i > 0 && m.endsWith("-01") && "border-l-2 border-l-slate-300",
                    )}
                  >
                    <div className="flex flex-col gap-1.5">
                      {(cells.get(`${a.id}:${m}`) ?? []).map((p) => (
                        <Link
                          key={`${p.r.id}-${p.karaoke}`}
                          href={`/releases/${p.r.id}`}
                          title={`${p.karaoke ? "カラオケ配信" : "楽曲リリース"}:${p.r.title}(${formatJa(p.date, true)})`}
                          className={clsx(
                            "block rounded-lg px-2 py-1.5 leading-tight transition hover:brightness-95",
                            p.karaoke ? "border-2 bg-white" : "text-white shadow-sm",
                            p.date < today && "opacity-50",
                          )}
                          style={p.karaoke ? { borderColor: MILESTONES.karaokeRelease.color } : { backgroundColor: a.color }}
                        >
                          <span className={clsx("block text-[11px] font-semibold tabular-nums", p.karaoke ? "text-pink-700" : "text-white/85")}>
                            {p.karaoke ? "カラオケ " : "◆ "}
                            {formatJa(p.date)}
                          </span>
                          <span className={clsx("line-clamp-2 block text-[13px] font-bold", p.karaoke && "text-slate-700")}>{p.r.title}</span>
                        </Link>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
