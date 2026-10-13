// 5種類の日付(マイルストーン)の定義。表示順・色・リマインド対象はすべてここで管理する。

export const MILESTONE_KEYS = [
  "demoDeadline",
  "recording",
  "masterDeadline",
  "teaserShoot",
  "musicSubmission",
  "jacketSubmission",
  "teaserRelease",
  "release",
  "karaokeSubmission",
  "karaokeRelease",
] as const;

export type MilestoneKey = (typeof MILESTONE_KEYS)[number];

export type DoneKey = "demoSubmitted" | "masterSubmitted" | "musicSubmitted" | "jacketSubmitted" | "karaokeSubmitted";

export type MilestoneDef = {
  key: MilestoneKey;
  label: string;
  short: string;
  /** submission=入稿(完了チェックあり・丸), release=公開/配信(ひし形), event=撮影など(四角) */
  kind: "submission" | "release" | "event";
  /** 入稿系のみ:完了フラグのカラム */
  doneKey?: DoneKey;
  /** 完了チェックの文言 */
  doneLabel?: string;
  /** マーカー・バッジの色 */
  color: string;
  /** 淡い背景色 */
  soft: string;
};

export const MILESTONES: Record<MilestoneKey, MilestoneDef> = {
  demoDeadline: {
    key: "demoDeadline",
    label: "DEMOデータ〆切日",
    short: "DEMO〆切",
    kind: "submission",
    doneKey: "demoSubmitted",
    doneLabel: "提出済み",
    color: "#475569",
    soft: "#e2e8f0",
  },
  recording: {
    key: "recording",
    label: "REC日",
    short: "REC",
    kind: "event",
    color: "#b45309",
    soft: "#ffedd5",
  },
  masterDeadline: {
    key: "masterDeadline",
    label: "MASTER音源〆切日",
    short: "MASTER〆切",
    kind: "submission",
    doneKey: "masterSubmitted",
    doneLabel: "提出済み",
    color: "#0891b2",
    soft: "#cffafe",
  },
  teaserShoot: {
    key: "teaserShoot",
    label: "ティザー撮影日",
    short: "ティザー撮影",
    kind: "event",
    color: "#65a30d",
    soft: "#ecfccb",
  },
  musicSubmission: {
    key: "musicSubmission",
    label: "楽曲データ入稿日",
    short: "楽曲入稿",
    kind: "submission",
    doneKey: "musicSubmitted",
    doneLabel: "入稿済み",
    color: "#0284c7",
    soft: "#e0f2fe",
  },
  jacketSubmission: {
    key: "jacketSubmission",
    label: "ジャケットデータ入稿日",
    short: "ジャケ入稿",
    kind: "submission",
    doneKey: "jacketSubmitted",
    doneLabel: "入稿済み",
    color: "#d97706",
    soft: "#fef3c7",
  },
  teaserRelease: {
    key: "teaserRelease",
    label: "ティザー公開日",
    short: "ティザー公開",
    kind: "release",
    color: "#7c3aed",
    soft: "#ede9fe",
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
    doneLabel: "入稿済み",
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

export function doneLabelOf(key: MilestoneKey): string {
  return MILESTONES[key].doneLabel ?? "完了";
}

export function milestonesOf(r: MilestoneSource): MilestoneItem[] {
  return MILESTONE_LIST.flatMap((m) => {
    const date = r[m.key];
    if (!date) return [];
    return [{ key: m.key, date, done: m.doneKey ? r[m.doneKey] : false }];
  });
}
