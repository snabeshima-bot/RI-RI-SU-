"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveRelease, type FormState } from "@/app/actions";
import { MilestoneMarker } from "@/components/milestone-marker";
import type { Artist, Release, Track } from "@/db/schema";
import { MILESTONES, RELEASE_TYPES, type MilestoneKey } from "@/lib/milestones";

type TrackInput = { key: number; title: string; isrc: string };

const GROUPS: { title: string; keys: MilestoneKey[] }[] = [
  { title: "配信", keys: ["musicSubmission", "jacketSubmission", "release"] },
  { title: "カラオケ", keys: ["karaokeSubmission", "karaokeRelease"] },
];

export function ReleaseForm({
  artists,
  release,
  tracks = [],
  defaultArtistId,
}: {
  artists: Artist[];
  release?: Release;
  tracks?: Track[];
  defaultArtistId?: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveRelease, undefined);
  const [trackList, setTrackList] = useState<TrackInput[]>(() =>
    tracks.length > 0 ? tracks.map((t, i) => ({ key: i, title: t.title, isrc: t.isrc })) : [{ key: 0, title: "", isrc: "" }],
  );
  const [nextKey, setNextKey] = useState(trackList.length);

  const updateTrack = (key: number, patch: Partial<TrackInput>) =>
    setTrackList((ts) => ts.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  const move = (index: number, dir: -1 | 1) =>
    setTrackList((ts) => {
      const j = index + dir;
      if (j < 0 || j >= ts.length) return ts;
      const copy = [...ts];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });

  return (
    <form action={action} className="space-y-5">
      {release && <input type="hidden" name="id" value={release.id} />}
      <input type="hidden" name="tracks" value={JSON.stringify(trackList.map(({ title, isrc }) => ({ title, isrc })))} />

      {state?.error && <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</div>}

      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="artistId">
            アーティスト
          </label>
          <select id="artistId" name="artistId" className="input" defaultValue={release?.artistId ?? defaultArtistId ?? ""} required>
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
          <label className="label" htmlFor="type">
            形態
          </label>
          <select id="type" name="type" className="input" defaultValue={release?.type ?? "single"}>
            {RELEASE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">
            作品タイトル
          </label>
          <input id="title" name="title" className="input text-base" defaultValue={release?.title} placeholder="例:新曲タイトル" required />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title} className="card p-5">
            <h2 className="mb-3 text-sm font-bold text-slate-700">{g.title}スケジュール</h2>
            <div className="space-y-3">
              {g.keys.map((k) => {
                const m = MILESTONES[k];
                return (
                  <div key={k} className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: m.soft }}>
                    <MilestoneMarker milestone={k} size={14} />
                    <label htmlFor={k} className="min-w-0 flex-1 text-sm font-semibold" style={{ color: m.color }}>
                      {m.label}
                    </label>
                    <input id={k} name={k} type="date" className="input w-40" defaultValue={release?.[k] ?? ""} />
                    {m.doneKey && (
                      <label className="flex items-center gap-1.5 text-sm text-slate-700">
                        <input type="checkbox" name={m.doneKey} defaultChecked={release?.[m.doneKey] ?? false} className="h-4 w-4 accent-emerald-600" />
                        入稿済み
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">収録曲</h2>
          <button
            type="button"
            className="btn-ghost text-indigo-600"
            onClick={() => {
              setTrackList((ts) => [...ts, { key: nextKey, title: "", isrc: "" }]);
              setNextKey((k) => k + 1);
            }}
          >
            + 曲を追加
          </button>
        </div>
        <ol className="space-y-2">
          {trackList.map((t, i) => (
            <li key={t.key} className="flex items-center gap-2">
              <span className="w-6 text-right text-sm font-semibold tabular-nums text-slate-400">{i + 1}</span>
              <input className="input flex-1" placeholder="曲名" value={t.title} onChange={(e) => updateTrack(t.key, { title: e.target.value })} />
              <input className="input w-40" placeholder="ISRC(任意)" value={t.isrc} onChange={(e) => updateTrack(t.key, { isrc: e.target.value })} />
              <button type="button" className="btn-ghost px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label="上へ">
                ↑
              </button>
              <button type="button" className="btn-ghost px-2" onClick={() => move(i, 1)} disabled={i === trackList.length - 1} aria-label="下へ">
                ↓
              </button>
              <button
                type="button"
                className="btn-ghost px-2 text-slate-400 hover:text-red-600"
                onClick={() => setTrackList((ts) => ts.filter((x) => x.key !== t.key))}
                aria-label="削除"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <label className="label" htmlFor="notes">
          メモ
        </label>
        <textarea id="notes" name="notes" rows={3} className="input" defaultValue={release?.notes} placeholder="配信ストア、担当者、注意事項など" />
      </section>

      <div className="flex justify-end">
        <SubmitButton label={release ? "変更を保存" : "登録する"} />
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary px-6" disabled={pending}>
      {pending ? "保存中…" : label}
    </button>
  );
}
