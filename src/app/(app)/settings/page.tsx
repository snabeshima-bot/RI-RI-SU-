import { eq } from "drizzle-orm";
import { requireUser } from "@/auth";
import { getDb, schema } from "@/db";
import { SubscriptionForm } from "@/components/subscription-form";
import { gcalSubscribeUrl } from "@/lib/gcal";
import { listArtists } from "@/lib/queries";
import { REMIND_DAYS_BEFORE } from "@/lib/reminders";

export default async function SettingsPage() {
  const user = await requireUser();
  const db = getDb();
  const [artists, [me], subs] = await Promise.all([
    listArtists(),
    db.select().from(schema.users).where(eq(schema.users.email, user.email)),
    db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userEmail, user.email)),
  ]);
  const calUrl = gcalSubscribeUrl();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">通知設定</h1>
        <p className="text-sm text-slate-500">{user.email}</p>
      </div>

      <section className="card p-5">
        <h2 className="font-bold">メールリマインド</h2>
        <p className="mt-1 text-sm text-slate-500">
          各日付の<strong>{REMIND_DAYS_BEFORE}日前の朝9時</strong>に、選んだアーティストの予定をまとめてメールでお知らせします。入稿済みにした項目は通知されません。
        </p>
        <SubscriptionForm artists={artists} notifyAll={me?.notifyAll ?? false} subscribed={subs.map((s) => s.artistId)} />
      </section>

      <section className="card p-5">
        <h2 className="font-bold">Googleカレンダー</h2>
        <p className="mt-1 text-sm text-slate-500">
          すべての日付は共有カレンダーに自動で登録されます。自分のGoogleカレンダーに追加すれば、カレンダー側の通知設定でもリマインドを受け取れます。
        </p>
        {calUrl ? (
          <a href={calUrl} target="_blank" rel="noreferrer" className="btn-outline mt-4">
            📅 共有カレンダーを追加する
          </a>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">共有カレンダーが未設定です(管理者が環境変数を設定してください)</p>
        )}
      </section>
    </div>
  );
}
