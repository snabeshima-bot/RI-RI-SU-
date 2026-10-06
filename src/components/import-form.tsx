"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { importReleases } from "@/app/actions";
import { MilestoneMarker } from "@/components/milestone-marker";
import type { Artist } from "@/db/schema";
import { formatJa } from "@/lib/dates";
import { parseSheet } from "@/lib/import";
import { MILESTONE_LIST } from "@/lib/milestones";

export function ImportForm({ artists, today }: { artists: Artist[]; today: string }) {
  const [artistId, setArtistId] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ error?: string; ok?: string } | undefined>();
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => (text.trim() ? parseSheet(text, today) : null), [text, today]);
  const usedKeys = MILESTONE_LIST.filter((m) => parsed?.columns.includes(m.key));
  const ignored = parsed ? parsed.headers.filter((h, i) => h && parsed.columns[i] === null) : [];
  const hasErrors = !!parsed?.rows.some((r) => r.errors.length > 0);
  const canSubmit = !!artistId && !!parsed && !parsed.error && parsed.rows.length > 0 && !hasErrors && !pending;

  const submit = () =>
    startTransition(async () => {
      const res = await importReleases({
        artistId,
        rows: parsed!.rows.map(({ title, dates }) => ({ title, dates })),
      });
      setResult(res);
      if (res?.ok) setText("");
    });

  if (artists.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-600">
        先に<Link href="/artists" className="text-indigo-600 underline">アーティスト</Link>を登録してください。
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {result?.ok && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {result.ok}
          <Link href={`/?artist=${artistId}`} className="font-semibold underline">
            スケジュールを見る
          </Link>
        </div>
      )}
      {result?.error && <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{result.error}</div>}

      <section className="card space-y-4 p-5">
        <div className="max-w-xs">
          <label className="label" htmlFor="import-artist">
            アーティスト
          </label>
          <select id="import-artist" className="input" value={artistId} onChange={(e) => setArtistId(e.target.value)}>
            <option value="" disabled>
              選択してください
            </option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="import-text">
            表を貼り付け
          </label>
          <textarea
            id="import-text"
            rows={7}
            className="input font-mono text-xs"
            placeholder={"曲名\tリリース日\tデータ入稿日\tジャケット入稿日\tティザー公開\tティザー撮影\n1\t11/5\t10/15\t10/22\t11/4\t10/28"}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(undefined);
            }}
          />
          <p className="mt-1 text-xs text-slate-500">
            読み取れる見出し:曲名 / リリース日 / データ入稿日 / ジャケット入稿日 / ティザー撮影 / ティザー公開 / カラオケ入稿日 / カラオケ配信日。曲名が空欄や番号だけの行は「新曲N(仮)」になります。
          </p>
        </div>
      </section>

      {parsed && (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3">
            <h2 className="font-bold">プレビュー</h2>
            {parsed.error ? (
              <span className="text-sm text-red-600">{parsed.error}</span>
            ) : (
              <span className="text-sm text-slate-500">{parsed.rows.length}件</span>
            )}
            {ignored.length > 0 && <span className="text-xs text-slate-400">読み飛ばす列:{ignored.join("、")}</span>}
            <button className="btn-primary ml-auto" disabled={!canSubmit} onClick={submit}>
              {pending ? "登録中…" : `${parsed.rows.length}件を登録`}
            </button>
          </div>
          {!parsed.error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-2 font-semibold">タイトル</th>
                    {usedKeys.map((m) => (
                      <th key={m.key} className="whitespace-nowrap px-3 py-2 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <MilestoneMarker milestone={m.key} size={10} />
                          {m.short}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r) => (
                    <tr key={r.line} className={clsx("border-b border-slate-100", r.errors.length > 0 && "bg-red-50")}>
                      <td className="px-4 py-2 font-semibold">
                        {r.title}
                        {r.errors.map((e) => (
                          <div key={e} className="text-xs font-normal text-red-600">
                            {r.line}行目:{e}
                          </div>
                        ))}
                      </td>
                      {usedKeys.map((m) => (
                        <td key={m.key} className="whitespace-nowrap px-3 py-2 tabular-nums">
                          {r.dates[m.key] ? formatJa(r.dates[m.key]!, true) : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
