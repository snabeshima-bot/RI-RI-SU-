# リリース管理

楽曲配信リリースのスケジュールを管理するWebアプリです。

- アーティスト(グループ)ごとのフィルター/全体表示
- 7種類の日付をタイムライン・カレンダー・一覧で表示
  - ティザー撮影日 / 楽曲データ入稿日 / ジャケットデータ入稿日 / ティザー公開日 / 楽曲リリース日 / カラオケ配信データ入稿日 / カラオケ配信日
- スプレッドシートの表を貼り付けて一括登録(「一括取り込み」画面)
- リマインド
  - **メール**:各日付の3日前・朝9時(JST)に、購読しているアーティストの予定をまとめて送信(入稿済みは除外)
  - **Googleカレンダー**:登録・更新のたびに共有カレンダーへ終日予定を自動作成
- Googleログイン必須(`@focpro.co.jp` のアカウントのみ)。ログインした人は全員が登録・編集できます。

技術構成:Next.js 15 (App Router) / Auth.js v5 / Neon Postgres + Drizzle ORM / Tailwind CSS v4 / Resend / Vercel Cron

---

## セットアップ手順

### 1. Google OAuth(ログイン)

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成(focpro.co.jp の組織内に作成)
2. 「APIとサービス」→「OAuth同意画面」:ユーザーの種類を **内部** に設定(組織外のアカウントはそもそもログインできなくなります)
3. 「認証情報」→「OAuthクライアントID」を作成(種類:ウェブアプリケーション)
   - 承認済みのリダイレクトURI:`https://<本番ドメイン>/api/auth/callback/google`(ローカル確認用に `http://localhost:3000/api/auth/callback/google` も追加可)
4. クライアントID / シークレットを `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` に設定

> アプリ側でも、Googleが返すIDトークンの `hd`(Workspaceドメイン)とメールアドレスを必ず検証しています(`src/lib/domain.ts`)。

### 2. Googleカレンダー(共有カレンダーへの自動登録)

1. 同じGoogle Cloudプロジェクトで **Google Calendar API** を有効化
2. 「サービスアカウント」を作成 → 「キー」→ JSONキーを作成してダウンロード
3. Googleカレンダーで共有用カレンダー(例:「配信リリース」)を作成
   - 「特定のユーザーとの共有」にサービスアカウントのメールアドレス(`xxx@xxx.iam.gserviceaccount.com`)を追加し、権限を **予定の変更** にする
   - 社内メンバーにも閲覧権限で共有
   - 「カレンダーの統合」にある **カレンダーID** を `GOOGLE_CALENDAR_ID` に設定
4. JSONキーの中身を1行にして `GOOGLE_SERVICE_ACCOUNT_JSON` に設定

各メンバーは「通知設定」画面のボタンから共有カレンダーを自分のGoogleカレンダーに追加し、カレンダー側の通知設定でもリマインドを受け取れます。
未設定の場合、カレンダー同期はスキップされます(アプリ自体は動きます)。

### 3. Vercel

1. このリポジトリをVercelにインポート
2. 「Storage」(Marketplace)から **Neon** を追加してプロジェクトに接続 → `DATABASE_URL` が自動で設定されます
3. 残りの環境変数を設定(`.env.example` 参照)

| 変数 | 内容 |
|---|---|
| `AUTH_SECRET` | `npx auth secret` などで生成したランダム文字列 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | 手順1のOAuthクライアント |
| `ALLOWED_DOMAIN` | 許可ドメイン(既定:`focpro.co.jp`) |
| `DATABASE_URL` | Neon接続文字列(自動設定。`POSTGRES_URL` や `STORAGE_DATABASE_URL` のような接頭辞付きの名前でも読み取ります) |
| `APP_URL` | 本番URL(メール内リンク用。未設定時はVercelの本番URL) |
| `RESEND_API_KEY` / `MAIL_FROM` | [Resend](https://resend.com) のAPIキーと送信元(送信ドメインの認証が必要) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_CALENDAR_ID` | 手順2 |
| `CRON_SECRET` | ランダム文字列(Vercel Cronが自動でAuthorizationヘッダーに付与) |

4. デプロイ。ビルド時に `DATABASE_URL` があればDBマイグレーションが自動で適用されます(`scripts/migrate.ts`)。

### 4. 最初の利用

1. ログイン → 「アーティスト」でグループを登録
2. 「+ リリース登録」で作品・日付・収録曲を登録
3. 「通知設定」でメールを受け取りたいアーティストを選択

---

## リマインドの仕組み

- `vercel.json` の Cron が毎日 UTC 0:00(= JST 9:00)に `/api/cron/reminders` を呼び出します
- 「今日(JST)+3日」の日付を持つ未完了の予定を抽出し、購読者ごとに1通にまとめて送信
- 送信済みは `reminder_logs` に記録し、再実行しても二重送信しません
- 手動確認:`curl -H "Authorization: Bearer $CRON_SECRET" "https://<domain>/api/cron/reminders?dry=1"`(送信せず対象だけ返す。`&date=YYYY-MM-DD` で基準日を変更可)

## ローカル開発

```bash
npm install
cp .env.example .env.local   # 値を設定(DATABASE_URL はローカルPostgresでも可)
npm run db:migrate
npm run db:seed              # サンプルデータ(アーティストが0件のときのみ)
npm run dev
```

| コマンド | 内容 |
|---|---|
| `npm run test` | 単体テスト(ドメイン判定・日付・リマインド抽出) |
| `npm run lint` / `npm run typecheck` | ESLint / 型チェック |
| `npm run db:generate` | `src/db/schema.ts` 変更後にマイグレーションSQLを生成 |
