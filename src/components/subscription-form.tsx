"use client";

import { useActionState, useState } from "react";
import { saveSubscriptions, type FormState } from "@/app/actions";
import type { Artist } from "@/db/schema";

export function SubscriptionForm({ artists, notifyAll, subscribed }: { artists: Artist[]; notifyAll: boolean; subscribed: number[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSubscriptions, undefined);
  const [all, setAll] = useState(notifyAll);

  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
        <input type="checkbox" name="notifyAll" checked={all} onChange={(e) => setAll(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
        <span className="font-semibold">すべてのアーティスト</span>
        <span className="text-xs text-slate-500">(今後追加されるアーティストも含む)</span>
      </label>
      <div className={`grid gap-2 sm:grid-cols-2 ${all ? "pointer-events-none opacity-40" : ""}`}>
        {artists.map((a) => (
          <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50">
            <input type="checkbox" name="artistIds" value={a.id} defaultChecked={subscribed.includes(a.id)} className="h-4 w-4 accent-indigo-600" />
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color }} />
            {a.name}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>
          保存
        </button>
        {state?.ok && <span className="text-sm text-emerald-600">{state.ok}</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
