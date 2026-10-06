import { ArtistRow, NewArtistForm } from "@/components/artist-forms";
import { listArtists, listReleases } from "@/lib/queries";

export default async function ArtistsPage() {
  const [artists, releases] = await Promise.all([listArtists(), listReleases()]);
  const counts = new Map<number, number>();
  for (const r of releases) counts.set(r.artistId, (counts.get(r.artistId) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">アーティスト</h1>
        <p className="text-sm text-slate-500">色はタイムラインやカレンダーでの識別に使われます。並び順は小さい数字が先です。</p>
      </div>
      <NewArtistForm nextOrder={(artists.at(-1)?.sortOrder ?? 0) + 10} />
      <div className="card divide-y divide-slate-100">
        {artists.length === 0 && <p className="p-8 text-center text-sm text-slate-400">まだ登録がありません</p>}
        {artists.map((a) => (
          <ArtistRow key={`${a.id}-${a.name}-${a.color}-${a.sortOrder}`} artist={a} releaseCount={counts.get(a.id) ?? 0} />
        ))}
      </div>
    </div>
  );
}
