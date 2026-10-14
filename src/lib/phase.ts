import { MILESTONES, milestonesOf, type MilestoneItem, type MilestoneSource } from "./milestones";

export const PHASES = [
  { key: "unscheduled", label: "日程未定", description: "日付が未入力" },
  { key: "production", label: "制作中", description: "DEMO〜MASTERが残っている" },
  { key: "submission", label: "入稿待ち", description: "入稿作業が残っている" },
  { key: "waiting", label: "リリース待ち", description: "入稿完了・配信待ち" },
  { key: "released", label: "リリース済み", description: "配信まで完了" },
] as const;

export type Phase = (typeof PHASES)[number]["key"];

/**
 * リリースの段階を判定する(上から順に当てはまったもの)。日付の入っていない工程は判定に使わない。
 * 1. 日程未定:日付が1つも無い
 * 2. 制作中:DEMO・歌割FIX・Live・MASTERが未完了、または REC日が今日以降
 * 3. 入稿待ち:楽曲・ジャケット・カラオケのデータ入稿が未完了
 * 4. リリース待ち:楽曲リリース日が未入力、または楽曲リリース日・カラオケ配信日が今日以降
 * 5. リリース済み
 * ティザー(撮影・公開)と初披露はプロモーションなので段階判定には使わない。
 */
export function releasePhase(r: MilestoneSource, today: string): Phase {
  if (milestonesOf(r).length === 0) return "unscheduled";
  const pending = (date: string | null, done: boolean) => !!date && !done;
  const upcoming = (date: string | null) => !!date && date >= today;

  if (
    pending(r.demoDeadline, r.demoSubmitted) ||
    pending(r.utawariFix, r.utawariFixed) ||
    pending(r.liveDeadline, r.liveSubmitted) ||
    pending(r.masterDeadline, r.masterSubmitted) ||
    upcoming(r.recording)
  ) {
    return "production";
  }
  if (
    pending(r.musicSubmission, r.musicSubmitted) ||
    pending(r.jacketSubmission, r.jacketSubmitted) ||
    pending(r.karaokeSubmission, r.karaokeSubmitted)
  ) {
    return "submission";
  }
  if (!r.release || upcoming(r.release) || upcoming(r.karaokeRelease)) return "waiting";
  return "released";
}

export type Step = MilestoneItem & { state: "done" | "next" | "todo" };

/**
 * 日付のある工程を日付順に並べ、完了/次/未着手を付ける。
 * 提出・入稿はチェックで完了、それ以外(REC・撮影・公開・配信)は日付を過ぎたら完了とみなす。
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
