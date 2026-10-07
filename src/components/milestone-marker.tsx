import clsx from "clsx";
import { MILESTONES, MILESTONE_LIST, type MilestoneKey } from "@/lib/milestones";

/** 公開・配信系=ひし形、入稿系=丸、撮影など=四角。完了済みはチェック、期限切れ未完了は赤枠。 */
export function MilestoneMarker({
  milestone,
  done = false,
  overdue = false,
  size = 14,
  className,
}: {
  milestone: MilestoneKey;
  done?: boolean;
  overdue?: boolean;
  size?: number;
  className?: string;
}) {
  const m = MILESTONES[milestone];
  const shape =
    m.kind === "release" ? "rotate-45 scale-[0.8] rounded-[3px]" : m.kind === "event" ? "scale-[0.85] rounded-[3px]" : "rounded-full";
  return (
    <span
      className={clsx("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <span
        className={clsx("absolute inset-0 border-2", shape)}
        style={{
          backgroundColor: done ? "#fff" : m.color,
          borderColor: overdue ? "#dc2626" : m.color,
          boxShadow: overdue ? "0 0 0 2px #fecaca" : undefined,
        }}
      />
      {done && (
        <svg viewBox="0 0 16 16" className="relative" width={size * 0.7} height={size * 0.7} aria-hidden>
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke={m.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export function MilestoneLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px]">
      {MILESTONE_LIST.map((m) => (
        <span
          key={m.key}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold"
          style={{ backgroundColor: m.soft, color: m.color }}
        >
          <MilestoneMarker milestone={m.key} size={12} />
          {m.label.replace(/日$/, "")}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 px-1 text-slate-500">
        <MilestoneMarker milestone="musicSubmission" size={12} done />
        入稿済み
      </span>
      <span className="inline-flex items-center gap-1.5 px-1 text-slate-500">
        <MilestoneMarker milestone="musicSubmission" size={12} overdue />
        期限超過
      </span>
    </div>
  );
}

export function DaysBadge({ days, done }: { days: number; done?: boolean }) {
  if (done) return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">完了</span>;
  const [label, cls] =
    days < 0
      ? [`${-days}日超過`, "bg-red-600 text-white"]
      : days === 0
        ? ["今日", "bg-red-100 text-red-700"]
        : days <= 3
          ? [`あと${days}日`, "bg-orange-100 text-orange-700"]
          : days <= 7
            ? [`あと${days}日`, "bg-amber-50 text-amber-700"]
            : [`あと${days}日`, "bg-slate-100 text-slate-600"];
  return <span className={clsx("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>{label}</span>;
}
