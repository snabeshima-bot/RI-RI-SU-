"use client";

import { useId, useState, useTransition } from "react";
import { createWriter } from "@/app/actions";

type WriterOption = { id: number; name: string };

/** 作家を複数選ぶ欄。名前を入力して候補から選ぶ。未登録の名前ならその場で作家登録する */
export function WriterPicker({
  label,
  writers,
  selected,
  onChange,
  onWriterCreated,
}: {
  label: string;
  writers: WriterOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  onWriterCreated: (w: WriterOption) => void;
}) {
  const listId = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const byId = new Map(writers.map((w) => [w.id, w]));

  const add = () => {
    const name = text.trim();
    if (!name) return;
    setError(null);
    const found = writers.find((w) => w.name === name);
    if (found) {
      if (!selected.includes(found.id)) onChange([...selected, found.id]);
      setText("");
      return;
    }
    if (!confirm(`「${name}」を新しい作家として登録しますか?`)) return;
    startTransition(async () => {
      const res = await createWriter(name);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      onWriterCreated(res);
      onChange([...selected, res.id]);
      setText("");
    });
  };

  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {selected.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-indigo-800">
            {byId.get(id)?.name ?? `#${id}`}
            <button
              type="button"
              className="flex h-4 w-4 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-200"
              onClick={() => onChange(selected.filter((x) => x !== id))}
              aria-label={`${byId.get(id)?.name ?? ""}を外す`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1">
        <input
          className="input py-1 text-xs"
          list={listId}
          placeholder="作家名を入力・選択"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <datalist id={listId}>
          {writers
            .filter((w) => !selected.includes(w.id))
            .map((w) => (
              <option key={w.id} value={w.name} />
            ))}
        </datalist>
        <button type="button" className="btn-outline shrink-0 px-2 py-1 text-xs" onClick={add} disabled={pending || !text.trim()}>
          追加
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
