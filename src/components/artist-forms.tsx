"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { deleteArtist, saveArtist, type FormState } from "@/app/actions";
import type { Artist } from "@/db/schema";

const PALETTE = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#64748b"];

function Message({ state }: { state: FormState }) {
  if (!state) return null;
  return state.error ? (
    <span className="text-xs text-red-600">{state.error}</span>
  ) : (
    <span className="text-xs text-emerald-600">{state.ok}</span>
  );
}

export function NewArtistForm({ nextOrder }: { nextOrder: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await saveArtist(prev, fd);
    if (res?.ok) formRef.current?.reset();
    return res;
  }, undefined);
  const color = PALETTE[Math.floor(nextOrder / 10) % PALETTE.length];

  return (
    <form ref={formRef} action={action} className="card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="new-name">
          新しいアーティスト
        </label>
        <input id="new-name" name="name" className="input" placeholder="グループ名" required />
      </div>
      <div>
        <label className="label" htmlFor="new-color">
          色
        </label>
        <input id="new-color" name="color" type="color" defaultValue={color} className="h-[38px] w-14 cursor-pointer rounded-lg border border-slate-300 p-1" />
      </div>
      <input type="hidden" name="sortOrder" value={nextOrder} />
      <button className="btn-primary" disabled={pending}>
        追加
      </button>
      <Message state={state} />
    </form>
  );
}

export function ArtistRow({ artist, releaseCount }: { artist: Artist; releaseCount: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveArtist, undefined);
  const [delState, delAction] = useActionState<FormState, FormData>(deleteArtist, undefined);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <form action={action} className="flex flex-1 flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={artist.id} />
        <input name="color" type="color" defaultValue={artist.color} className="h-9 w-11 cursor-pointer rounded-lg border border-slate-300 p-1" aria-label="色" />
        <input name="name" defaultValue={artist.name} className="input min-w-40 flex-1" aria-label="名前" required />
        <input name="sortOrder" type="number" defaultValue={artist.sortOrder} className="input w-20" aria-label="並び順" />
        <button className="btn-outline py-1.5" disabled={pending}>
          保存
        </button>
        <Message state={state} />
      </form>
      <Link href={`/?artist=${artist.id}`} className="text-xs text-slate-500 hover:text-indigo-600">
        {releaseCount}件のリリース →
      </Link>
      <form
        action={delAction}
        onSubmit={(e) => {
          if (!confirm(`「${artist.name}」を削除しますか?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={artist.id} />
        <button className="btn-ghost px-2 text-slate-400 hover:text-red-600" disabled={releaseCount > 0} title={releaseCount > 0 ? "リリースがあるため削除できません" : "削除"}>
          ✕
        </button>
      </form>
      <Message state={delState} />
    </div>
  );
}
