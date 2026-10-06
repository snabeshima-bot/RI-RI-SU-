import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { getDb, schema } from "@/db";
import { isAllowedGoogleProfile } from "@/lib/domain";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !isAllowedGoogleProfile(profile)) {
        console.warn("[auth] ログイン拒否", {
          provider: account?.provider,
          email: profile?.email,
          hd: profile?.hd,
          email_verified: profile?.email_verified,
        });
        return false;
      }
      const email = profile!.email!.toLowerCase();
      const name = (profile!.name as string | undefined) ?? null;
      const image = (profile!.picture as string | undefined) ?? null;
      // ユーザー記録はログイン可否に影響させない(DB未接続でもログインはできるようにする)
      try {
        await getDb()
          .insert(schema.users)
          .values({ email, name, image })
          .onConflictDoUpdate({
            target: schema.users.email,
            set: { name, image, lastLoginAt: new Date() },
          });
      } catch (e) {
        console.error("[auth] ユーザー記録の保存に失敗", e);
      }
      return true;
    },
  },
});

/** Server Action / Route Handler 用。未ログインなら例外。 */
export async function requireUser() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) throw new Error("ログインが必要です");
  return { email, name: session!.user!.name ?? email };
}
