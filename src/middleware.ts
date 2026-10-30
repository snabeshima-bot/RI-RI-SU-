import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { migratedUrl } from "@/lib/redirect";

const { auth } = NextAuth(authConfig);
const authMiddleware = auth as unknown as (req: NextRequest, ev: NextFetchEvent) => Promise<Response | undefined>;

// リリース管理は NRC ALL IN ONE SYSTEM（/release）へ移行。
// RELEASE_REDIRECT_URL を設定すると、ログイン画面を含むすべての画面を移行先へ転送する（Cron・認証APIは対象外）。
// 未設定の間は従来どおり、ログイン画面以外はログイン必須。
export async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const to = migratedUrl(process.env.RELEASE_REDIRECT_URL, req.nextUrl.pathname, req.nextUrl.search);
  if (to) return NextResponse.redirect(to, 308);
  if (req.nextUrl.pathname.startsWith("/login")) return NextResponse.next();
  return authMiddleware(req, ev);
}

export const config = {
  // 認証API・Cron(CRON_SECRETで別途保護)・静的ファイル以外
  matcher: ["/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
