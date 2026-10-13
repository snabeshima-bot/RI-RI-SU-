import { NewWriterForm, WriterRow } from "@/components/writer-forms";
import { listWriters } from "@/lib/queries";

export default async function WritersPage() {
  const writers = await listWriters();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">作家</h1>
        <p className="text-sm text-slate-500">登録した作家は、リリース編集画面の収録曲で作詞・作曲・編曲として選べます。</p>
      </div>
      <NewWriterForm />
      <div className="card divide-y divide-slate-100">
        {writers.length === 0 && <p className="p-8 text-center text-sm text-slate-400">まだ登録がありません</p>}
        {writers.map((w) => (
          <WriterRow key={`${w.id}-${w.name}`} writer={w} creditCount={w.creditCount} />
        ))}
      </div>
    </div>
  );
}
