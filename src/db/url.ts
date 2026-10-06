// Node専用の依存を持たないので、ビルドスクリプトや drizzle.config からも読み込める

const NAMES = ["DATABASE_URL", "POSTGRES_URL"];

/**
 * DB接続文字列を環境変数から探す。
 * Vercel の Storage 連携では接頭辞付き(例:STORAGE_DATABASE_URL)で登録されることがあるため、それも探す。
 */
export function databaseUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  for (const name of NAMES) if (env[name]) return env[name];
  for (const name of NAMES) {
    const key = Object.keys(env).find((k) => k.endsWith(`_${name}`) && env[k]);
    if (key) return env[key];
  }
  return undefined;
}
