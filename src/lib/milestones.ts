// 5種類の日付(マイルストーン)の定義。表示順・色・リマインド対象はすべてここで管理する。

export const MILESTONE_KEYS = [
  "musicSubmission",
  "jacketSubmission",
  "release",
  "karaokeSubmission",
  "karaokeRelease",
] as const;

export type MilestoneKey = (typeof MILESTONE_KEYS)[number];

export type DoneKey = "musicSubmitted" | "jacketSubmitted" | "karaokeSubmitted";

export type MilestoneDef = {
  key: MilestoneKey;
  label: string;
  short: string;
  kind: "submission" | "release";
  /** 入稿系のみ:完了フラグのカラム */
  doneKey?: DoneKey;
  /** マーカー・バッジの色 */
  color: string;
  /** 淡い背景色 */
  soft: string;
};

export const MILESTONES: Record<MilestoneKey, MilestoneDef> = {
  musicSubmission: {
    key: "musicSubmission",
    label: "楽曲データ入稿日",
    short: "楽曲入稿",
    kind: "submission",
    doneKey: "musicSubmitted",
    color: "#0284c7",
    soft: "#e0f2fe",
  },
  jacketSubmission: {
    key: "jacketSubmission",
    label: "ジャケットデータ入稿日",
    short: "ジャケ入稿",
    kind: "submission",
    doneKey: "jacketSubmitted",
    color: "#d97706",
    soft: "#fef3c7",
  },
  release: {
    key: "release",
    label: "楽曲リリース日",
    short: "リリース",
    kind: "release",
    color: "#4f46e5",
    soft: "#e0e7ff",
  },
  karaokeSubmission: {
    key: "karaokeSubmission",
    label: "カラオケ配信データ入稿日",
    short: "カラオケ入稿",
    kind: "submission",
    doneKey: "karaokeSubmitted",
    color: "#0d9488",
    soft: "#ccfbf1",
  },
  karaokeRelease: {
    key: "karaokeRelease",
    label: "カラオケ配信日",
    short: "カラオケ配信",
    kind: "release",
    color: "#db2777",
    soft: "#fce7f3",
  },
};

export const MILESTONE_LIST: MilestoneDef[] = MILESTONE_KEYS.map((k) => MILESTONES[k]);

export const RELEASE_TYPES = [
  { value: "single", label: "シングル" },
  { value: "ep", label: "EP" },
  { value: "album", label: "アルバム" },
  { value: "other", label: "その他" },
] as const;

export function releaseTypeLabel(value: string): string {
  return RELEASE_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** タイムライン等に渡すための、マイルストーンを持つリリースの最小形 */
export type MilestoneSource = {
  [K in MilestoneKey]: string | null;
} & {
  [K in DoneKey]: boolean;
};

export type MilestoneItem = {
  key: MilestoneKey;
  date: string;
  done: boolean;
};

export function milestonesOf(r: MilestoneSource): MilestoneItem[] {
  return MILESTONE_LIST.flatMap((m) => {
    const date = r[m.key];
    if (!date) return [];
    return [{ key: m.key, date, done: m.doneKey ? r[m.doneKey] : false }];
  });
}
