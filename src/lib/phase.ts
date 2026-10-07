import { MILESTONES, milestonesOf, type MilestoneItem, type MilestoneSource } from "./milestones";

export const PHASES = [
  { key: "unscheduled", label: "日程未定", description: "リリース日が未入力" },
  { key: "production", label: "制作中", description: "未完了の入稿がある" },
  { key: "waiting", label: "入稿済み・公開待ち", description: "入稿がすべて完了" },
  { key: "released", label: "リリース済み", description: "リリース日を過ぎた" },
] as const;

export type Phase = (typeof PHASES)[number]["key"];

type PhaseSource = MilestoneSource & { release: string | null };

/** 楽曲・ジャケット入稿の完了状況とリリース日から、リリースの段階を判定する */
export function releasePhase(r: PhaseSource, today: string): Phase {
  if (!r.release) return "unscheduled";
  if (r.release <= today) return "released";
  const submissions = [
    { date: r.musicSubmission, done: r.musicSubmitted },
    { date: r.jacketSubmission, done: r.jacketSubmitted },
  ].filter((s) => s.date);
  if (submissions.length === 0 || submissions.some((s) => !s.done)) return "production";
  return "waiting";
}

export type Step = MilestoneItem & { state: "done" | "next" | "todo" };

/**
 * 日付のある工程を日付順に並べ、完了/次/未着手を付ける。
 * 入稿は「入稿済み」チェックで完了、それ以外(撮影・公開・配信)は日付を過ぎたら完了とみなす。
 */
export function releaseSteps(r: MilestoneSource, today: string): Step[] {
  const items = milestonesOf(r).sort((a, b) => a.date.localeCompare(b.date));
  let nextFound = false;
  return items.map((it) => {
    const isSubmission = MILESTONES[it.key].kind === "submission";
    const done = isSubmission ? it.done : it.date < today;
    if (done) return { ...it, state: "done" };
    if (!nextFound) {
      nextFound = true;
      return { ...it, state: "next" };
    }
    return { ...it, state: "todo" };
  });
}
