/**
 * NRC ALL IN ONE への移行後の転送先を返す（RELEASE_REDIRECT_URL 未設定なら null＝従来どおり動く）。
 * 旧URL → 新URL: / → /release、/releases/12 → /release/releases/12、/artists → /release/artists など。
 */
export function migratedUrl(base: string | undefined, pathname: string, search: string): string | null {
  if (!base) return null;
  const root = base.replace(/\/$/, "");
  const path = pathname === "/" || pathname === "/login" ? "" : pathname;
  return `${root}/release${path}${search}`;
}
