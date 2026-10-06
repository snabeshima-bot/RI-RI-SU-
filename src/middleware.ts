import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // ログイン画面・認証API・Cron(CRON_SECRETで別途保護)・静的ファイル以外はすべてログイン必須
  matcher: ["/((?!login|api/auth|api/cron|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
