import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRelease, resyncCalendar } from "@/app/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { ReleaseForm } from "@/components/release-form";
import { gcalConfigured } from "@/lib/gcal";
import { getRelease, listArtists } from "@/lib/queries";

export default async function EditReleasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [data, artists] = await Promise.all([getRelease(Number(id)), listArtists()]);
  if (!data) notFound();
  const { release, tracks } = data;
  const artist = artists.find((a) => a.id === release.artistId);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/?artist=${release.artistId}`} className="text-sm text-slate-500 hover:text-slate-800">
            ← {artist?.name ?? "スケジュール"}へ戻る
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <span className="h-6 w-1.5 rounded-full" style={{ backgroundColor: artist?.color }} />
            {release.title}
          </h1>
          <p className="text-xs text-slate-500">
            最終更新:{release.updatedAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            {release.updatedBy && ` · ${release.updatedBy}`}
          </p>
        </div>
        <form action={deleteRelease}>
          <input type="hidden" name="id" value={release.id} />
          <ConfirmButton className="btn-danger" message={`「${release.title}」を削除しますか?`}>
            削除
          </ConfirmButton>
        </form>
      </div>

      {saved && !release.gcalError && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          保存しました{gcalConfigured() && "(Googleカレンダーにも反映済み)"}
        </div>
      )}
      {release.gcalError && (
        <form action={resyncCalendar} className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <input type="hidden" name="id" value={release.id} />
          <span className="flex-1">{release.gcalError}</span>
          <button className="btn-outline py-1">再同期</button>
        </form>
      )}

      <ReleaseForm key={release.updatedAt.toISOString()} artists={artists} release={release} tracks={tracks} />
    </div>
  );
}
