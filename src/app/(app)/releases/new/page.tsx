import Link from "next/link";
import { ReleaseForm } from "@/components/release-form";
import { listArtists } from "@/lib/queries";

export default async function NewReleasePage({ searchParams }: { searchParams: Promise<{ artist?: string }> }) {
  const { artist } = await searchParams;
  const artists = await listArtists();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← スケジュールへ戻る
        </Link>
        <h1 className="mt-1 text-2xl font-bold">リリースを登録</h1>
      </div>
      {artists.length === 0 ? (
        <div className="card p-8 text-center text-slate-600">
          先に<Link href="/artists" className="text-indigo-600 underline">アーティスト</Link>を登録してください。
        </div>
      ) : (
        <ReleaseForm artists={artists} defaultArtistId={Number(artist) || undefined} />
      )}
    </div>
  );
}
