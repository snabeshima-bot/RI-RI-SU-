// スプレッドシートからコピーした表(タブ区切り)をリリースの行に変換する

import { addDays, isValidDate } from "./dates";
import type { MilestoneKey } from "./milestones";

/** 見出し → 項目。表記ゆれを吸収するため、空白を除いて部分一致で判定する(長い語から順に) */
const HEADER_RULES: [string, MilestoneKey | "title"][] = [
  ["カラオケ配信データ入稿", "karaokeSubmission"],
  ["カラオケデータ入稿", "karaokeSubmission"],
  ["カラオケ入稿", "karaokeSubmission"],
  ["カラオケ配信", "karaokeRelease"],
  ["ジャケットデータ入稿", "jacketSubmission"],
  ["ジャケット入稿", "jacketSubmission"],
  ["ジャケ入稿", "jacketSubmission"],
  ["楽曲データ入稿", "musicSubmission"],
  ["音源入稿", "musicSubmission"],
  ["データ入稿", "musicSubmission"],
  ["ティザー撮影", "teaserShoot"],
  ["ティザー公開", "teaserRelease"],
  ["リリース", "release"],
  ["配信日", "release"],
  ["曲名", "title"],
  ["タイトル", "title"],
  ["作品名", "title"],
];

export function headerToField(header: string): MilestoneKey | "title" | null {
  const h = header.replace(/\s/g, "");
  if (!h) return null;
  for (const [word, field] of HEADER_RULES) if (h.includes(word)) return field;
  return null;
}

/**
 * "11/5" "2026/11/5" "2026-11-05" "11月5日" などを YYYY-MM-DD に変換する。
 * 年が無い場合は、今日から90日以上前になるなら翌年とみなす。
 */
export function parseDateCell(cell: string, today: string): string | null | "invalid" {
  const s = cell.trim().replace(/[(（].*?[)）]/g, "").replace(/[／]/g, "/").trim();
  if (!s || s === "-" || s === "ー" || s === "未定") return null;
  let y: number | undefined, m: number, d: number;
  let match = s.match(/^(\d{4})[/\-.年](\d{1,2})[/\-.月](\d{1,2})日?$/);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = s.match(/^(\d{1,2})[/\-.月](\d{1,2})日?$/))) {
    [m, d] = [Number(match[1]), Number(match[2])];
  } else {
    return "invalid";
  }
  const fmt = (yy: number) => `${yy}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (y === undefined) {
    const thisYear = Number(today.slice(0, 4));
    y = fmt(thisYear) < addDays(today, -90) ? thisYear + 1 : thisYear;
  }
  const out = fmt(y);
  return isValidDate(out) ? out : "invalid";
}

export type ImportRow = {
  line: number;
  title: string;
  dates: Partial<Record<MilestoneKey, string>>;
  errors: string[];
};

export type ImportResult = {
  columns: (MilestoneKey | "title" | null)[];
  headers: string[];
  rows: ImportRow[];
  error?: string;
};

export function parseSheet(text: string, today: string): ImportResult {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim() !== "");
  if (lines.length < 2) return { columns: [], headers: [], rows: [], error: "見出し行とデータ行を貼り付けてください" };
  const split = (l: string) => (l.includes("\t") ? l.split("\t") : l.split(/,|\s{2,}/));
  const headers = split(lines[0]).map((h) => h.trim());
  const columns = headers.map(headerToField);
  if (!columns.some((c) => c && c !== "title")) {
    return { columns, headers, rows: [], error: "日付の列が見つかりません。1行目に「リリース日」などの見出しを含めてください" };
  }

  const rows = lines.slice(1).map((l, i): ImportRow => {
    const cells = split(l);
    const row: ImportRow = { line: i + 2, title: "", dates: {}, errors: [] };
    columns.forEach((field, c) => {
      const cell = (cells[c] ?? "").trim();
      if (!field) return;
      if (field === "title") {
        row.title = cell;
        return;
      }
      const parsed = parseDateCell(cell, today);
      if (parsed === "invalid") row.errors.push(`「${headers[c]}」の日付「${cell}」を読み取れません`);
      else if (parsed) row.dates[field] = parsed;
    });
    // 曲名が空・番号だけのときは仮タイトルにする
    if (!row.title || /^\d+$/.test(row.title)) row.title = `新曲${row.title || i + 1}(仮)`;
    return row;
  });
  return { columns, headers, rows };
}
