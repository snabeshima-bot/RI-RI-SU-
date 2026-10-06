import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { NavLinks } from "@/components/nav-links";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { name, email, image } = session.user;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">♪</span>
            <span className="hidden sm:inline">リリース管理</span>
          </Link>
          <NavLinks />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/releases/new" className="btn-primary hidden sm:inline-flex">
              + リリース登録
            </Link>
            <div className="group relative">
              <button className="flex items-center rounded-full ring-offset-2 focus:ring-2 focus:ring-indigo-300" aria-label="アカウント">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                    {(name ?? email ?? "?").slice(0, 1)}
                  </span>
                )}
              </button>
              <div className="invisible absolute right-0 top-full w-56 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="card p-2 text-sm">
                  <div className="px-2 py-1.5">
                    <div className="font-semibold">{name}</div>
                    <div className="truncate text-xs text-slate-500">{email}</div>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/login" });
                    }}
                  >
                    <button className="w-full rounded-md px-2 py-1.5 text-left text-slate-600 hover:bg-slate-100">ログアウト</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
  );
}
