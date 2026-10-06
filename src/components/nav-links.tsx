"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/", label: "スケジュール" },
  { href: "/releases/new", label: "登録", mobileOnly: true },
  { href: "/artists", label: "アーティスト" },
  { href: "/import", label: "一括取り込み" },
  { href: "/settings", label: "通知設定" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors",
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100",
              l.mobileOnly && "sm:hidden",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
