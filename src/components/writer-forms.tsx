"use client";

import { useActionState, useRef } from "react";
import { deleteWriter, saveWriter, type FormState } from "@/app/actions";
import type { Writer } from "@/db/schema";

function Message({ state }: { state: FormState }) {
  if (!state) return null;
  return state.error ? <span className="text-xs text-red-600">{state.error}</span> : <span className="text-xs text-emerald-600">{state.ok}</span>;
}

export function NewWriterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await saveWriter(prev, fd);
    if (res?.ok) formRef.current?.reset();
    return res;
  }, undefined);
  return (
    <form ref={formRef} action={action} className="card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="new-writer">
          新しい作家
        </label>
        <input id="new-writer" name="name" className="input" placeholder="作家名" required />
      </div>
      <button className="btn-primary" disabled={pending}>
        追加
      </button>
      <Message state={state} />
    </form>
  );
}

export function WriterRow({ writer, creditCount }: { writer: Writer; creditCount: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveWriter, undefined);
  const [delState, delAction] = useActionState<FormState, FormData>(deleteWriter, undefined);
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <form action={action} className="flex flex-1 flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={writer.id} />
        <input name="name" defaultValue={writer.name} className="input min-w-40 flex-1" aria-label="名前" required />
        <button className="btn-outline py-1.5" disabled={pending}>
          保存
        </button>
        <Message state={state} />
      </form>
      <span className="text-xs text-slate-500">{creditCount}件のクレジット</span>
      <form
        action={delAction}
        onSubmit={(e) => {
          if (!confirm(`「${writer.name}」を削除しますか?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={writer.id} />
        <button
          className="btn-ghost px-2 text-slate-400 hover:text-red-600"
          disabled={creditCount > 0}
          title={creditCount > 0 ? "担当曲があるため削除できません" : "削除"}
        >
          ✕
        </button>
      </form>
      <Message state={delState} />
    </div>
  );
}
