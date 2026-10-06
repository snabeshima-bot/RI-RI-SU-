import Link from "next/link";
import { ImportForm } from "@/components/import-form";
import { todayJST } from "@/lib/dates";
import { listArtists } from "@/lib/queries";

export default async function ImportPage() {
  const artists = await listArtists();
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← スケジュールへ戻る
        </Link>
        <h1 className="mt-1 text-2xl font-bold">一括取り込み</h1>
        <p className="text-sm text-slate-500">
          スプレッドシートの表を見出し行ごとコピーして貼り付けると、まとめて登録できます。年が書かれていない日付は、近い将来の日付として読み取ります。
        </p>
      </div>
      <ImportForm artists={artists} today={todayJST()} />
    </div>
  );
}
