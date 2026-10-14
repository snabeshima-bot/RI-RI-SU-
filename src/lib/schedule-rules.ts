// 日付どうしの前後関係のルール(〜までに必要)
import { formatJa } from "./dates";
import { MILESTONES, type MilestoneKey } from "./milestones";

type Dates = Partial<Record<MilestoneKey, string | null>>;

/** [期限のある工程, その工程が間に合っていなければならない日] */
export const DEADLINE_RULES: [MilestoneKey, MilestoneKey][] = [
  ["masterDeadline", "musicSubmission"], // MASTER音源は配信データ入稿日までに
  ["liveDeadline", "firstPerformance"], // Live音源は初披露日までに
];

/** 期限が未入力なら、基準になる日付をそのまま入れる */
export function applyDeadlineDefaults<T extends Dates>(r: T): T {
  const out: T = { ...r };
  for (const [key, by] of DEADLINE_RULES) {
    if (!out[key] && out[by]) (out as Dates)[key] = out[by];
  }
  return out;
}

/** 期限が基準日より後になっている組み合わせを警告文にする */
export function scheduleWarnings(r: Dates): string[] {
  return DEADLINE_RULES.flatMap(([key, by]) => {
    const d = r[key];
    const limit = r[by];
    if (!d || !limit || d <= limit) return [];
    return [
      `${MILESTONES[key].label.replace(/〆切日$/, "")}〆切(${formatJa(d)})が${MILESTONES[by].label.replace(/日$/, "")}(${formatJa(limit)})より後になっています`,
    ];
  });
}

export function deadlineHint(key: MilestoneKey): string | null {
  const rule = DEADLINE_RULES.find(([k]) => k === key);
  return rule ? `${MILESTONES[rule[1]].label}までに` : null;
}
