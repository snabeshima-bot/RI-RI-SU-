// middleware(Edge)からも読み込むため、DBなどNode専用の依存はここに置かない
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { allowedDomain, isAllowedGoogleProfile } from "@/lib/domain";

export const authConfig = {
  providers: [
    Google({
      authorization: { params: { hd: allowedDomain(), prompt: "select_account" } },
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      return isAllowedGoogleProfile(profile);
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
