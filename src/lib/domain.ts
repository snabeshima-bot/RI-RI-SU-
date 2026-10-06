export function allowedDomain(): string {
  return (process.env.ALLOWED_DOMAIN || "focpro.co.jp").toLowerCase();
}

type GoogleProfileLike = {
  email?: string | null;
  email_verified?: boolean | null;
  hd?: string | null;
};

/**
 * Googleのプロフィールが許可ドメイン(Google Workspace)のものかを判定する。
 * `hd` パラメータはクライアント側で書き換えられるため、IDトークン内の hd と
 * メールアドレスの両方をサーバー側で必ず確認する。
 */
export function isAllowedGoogleProfile(
  profile: GoogleProfileLike | null | undefined,
  domain: string = allowedDomain(),
): boolean {
  if (!profile?.email || profile.email_verified !== true) return false;
  const email = profile.email.toLowerCase();
  return profile.hd?.toLowerCase() === domain && email.endsWith(`@${domain}`);
}
