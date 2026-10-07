import Link from "next/link";
import clsx from "clsx";
import { ArtistFilter } from "@/components/artist-filter";
import { CalendarView } from "@/components/calendar-view";
import { ListView } from "@/components/list-view";
import { MilestoneLegend } from "@/components/milestone-marker";
import { MonthBoard } from "@/components/month-board";
import { Roadmap } from "@/components/roadmap";
import { Timeline } from "@/components/timeline/timeline";
import { Upcoming } from "@/components/upcoming";
import { todayJST } from "@/lib/dates";
import { listArtists, listReleases } from "@/lib/queries";

export const dynamic = "force-dynamic";

const VIEWS = [
  { key: "board", label: "タイムライン" },
  { key: "roadmap", label: "ロードマップ" },
  { key: "calendar", label: "カレンダー" },
  { key: "list", label: "一覧" },
  { key: "gantt", label: "ガント" },
] as const;
const DEFAULT_VIEW = "board";
/** 横幅を広く使うビュー(右の「直近の予定」を出さない) */
const WIDE_VIEWS: string[] = ["board", "roadmap"];
type View = (typeof VIEWS)[number]["key"];

type Search = { artist?: string; view?: string; month?: string; past?: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const today = todayJST();
  const [artists, all] = await Promise.all([listArtists(), listReleases()]);

  const artistId = artists.some((a) => a.id === Number(sp.artist)) ? Number(sp.artist) : null;
  const view: View = VIEWS.some((v) => v.key === sp.view) ? (sp.view as View) : DEFAULT_VIEW;
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? `${sp.month}-01` : today;
  const releases = artistId ? all.filter((r) => r.artistId === artistId) : all;

  const counts = new Map<number, number>();
  for (const r of all) counts.set(r.artistId, (counts.get(r.artistId) ?? 0) + 1);

  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { artist: artistId ? String(artistId) : undefined, view, month: sp.month, past: sp.past, ...patch };
    if (merged.artist) p.set("artist", merged.artist);
    if (merged.view && merged.view !== DEFAULT_VIEW) p.set("view", merged.view);
    if (merged.view !== "list" && merged.view !== "gantt" && merged.month) p.set("month", merged.month);
    if (merged.view === "list" && merged.past) p.set("past", merged.past);
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };

  const current = artists.find((a) => a.id === artistId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{current ? current.name : "すべてのアーティスト"}</h1>
          <p className="text-sm text-slate-500">配信リリース・入稿スケジュール</p>
        </div>
        <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-200/70 p-1 text-sm">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={href({ view: v.key })}
              scroll={false}
              className={clsx("whitespace-nowrap rounded-lg px-4 py-1.5 font-medium", view === v.key ? "bg-white shadow-sm" : "text-slate-600 hover:text-slate-900")}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      {artists.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-600">まずはアーティストを登録しましょう。</p>
          <Link href="/artists" className="btn-primary mt-4">
            アーティストを登録
          </Link>
        </div>
      ) : (
        <>
          <ArtistFilter artists={artists} current={artistId} counts={counts} hrefFor={(id) => href({ artist: id ? String(id) : undefined })} />

          {WIDE_VIEWS.includes(view) ? (
            <div className="space-y-4">
              {view === "board" && (
                <>
                  <MilestoneLegend />
                  <MonthBoard releases={releases} today={today} from={month} hrefForMonth={(m) => href({ month: m })} />
                </>
              )}
              {view === "roadmap" && (
                <Roadmap
                  artists={artists}
                  releases={releases}
                  today={today}
                  from={month}
                  hrefForMonth={(m) => href({ month: m })}
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-3">
                <MilestoneLegend />
                {view === "gantt" && <Timeline releases={releases} today={today} />}
                {view === "calendar" && (
                  <CalendarView releases={releases} today={today} month={month} hrefForMonth={(m) => href({ month: m })} />
                )}
                {view === "list" && (
                  <>
                    <div className="flex justify-end">
                      <Link href={href({ past: sp.past ? undefined : "1" })} scroll={false} className="text-xs text-slate-500 hover:text-slate-800">
                        {sp.past ? "✓ 過去のリリースも表示中" : "過去のリリースも表示"}
                      </Link>
                    </div>
                    <ListView releases={releases} today={today} showPast={!!sp.past} />
                  </>
                )}
              </div>
              <aside className="space-y-5">
                <Upcoming releases={releases} today={today} />
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
