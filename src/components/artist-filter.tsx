import Link from "next/link";
import clsx from "clsx";
import type { Artist } from "@/db/schema";

export function ArtistFilter({
  artists,
  current,
  counts,
  hrefFor,
}: {
  artists: Artist[];
  current: number | null;
  counts: Map<number, number>;
  hrefFor: (artistId: number | null) => string;
}) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-wrap gap-2">
      <Chip href={hrefFor(null)} active={current === null} label="すべて" count={total} />
      {artists.map((a) => (
        <Chip key={a.id} href={hrefFor(a.id)} active={current === a.id} label={a.name} count={counts.get(a.id) ?? 0} color={a.color} />
      ))}
    </div>
  );
}

function Chip({ href, active, label, count, color }: { href: string; active: boolean; label: string; count: number; color?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
      )}
      style={active ? { backgroundColor: color ?? "#0f172a" } : undefined}
    >
      {color && !active && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}
      <span className={clsx("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/25" : "bg-slate-100 text-slate-500")}>{count}</span>
    </Link>
  );
}
