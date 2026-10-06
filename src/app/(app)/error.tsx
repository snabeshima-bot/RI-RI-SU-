"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center">
      <h1 className="text-lg font-bold">データを読み込めませんでした</h1>
      <p className="mt-2 text-sm text-slate-600">
        データベースが未接続、または初期設定(テーブル作成)が済んでいない可能性があります。
        <br />
        Vercel の Storage で Neon を接続し、再デプロイしてください。
      </p>
      {error.digest && <p className="mt-3 text-xs text-slate-400">エラーID:{error.digest}</p>}
      <button className="btn-outline mt-5" onClick={reset}>
        再読み込み
      </button>
    </div>
  );
}
