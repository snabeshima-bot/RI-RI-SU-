import Link from "next/link";
import clsx from "clsx";
import { MilestoneMarker } from "@/components/milestone-marker";
import { MILESTONE_LIST, toggleMilestoneType, type MilestoneKey } from "@/lib/milestones";

/** 日付の種類で絞り込むチップ。複数選択でき、「すべて」で解除する */
export function MilestoneTypeFilter({
  selected,
  hrefFor,
}: {
  selected: MilestoneKey[];
  hrefFor: (types: MilestoneKey[]) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
      <span className="mr-1 text-xs font-semibold text-slate-500">表示する日付:</span>
      <Link
        href={hrefFor([])}
        scroll={false}
        className={clsx(
          "rounded-full border px-3 py-1 font-semibold",
          selected.length === 0 ? "border-transparent bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
        )}
      >
        すべて
      </Link>
      {MILESTONE_LIST.map((m) => {
        const on = selected.includes(m.key);
        return (
          <Link
            key={m.key}
            href={hrefFor(toggleMilestoneType(selected, m.key))}
            scroll={false}
            aria-pressed={on}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold transition-colors",
              on ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-300",
            )}
            style={on ? { backgroundColor: m.color } : { color: m.color }}
          >
            {!on && <MilestoneMarker milestone={m.key} size={11} />}
            {on && "✓ "}
            {m.short}
          </Link>
        );
      })}
    </div>
  );
}
