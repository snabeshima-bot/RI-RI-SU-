// 日付は "YYYY-MM-DD" 文字列で扱い、「今日」は常に日本時間で判定する。

const TZ = "Asia/Tokyo";

export function todayJST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUTC(toUTC(date) + days * 86_400_000);
}

export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(a) - toUTC(b)) / 86_400_000);
}

export function startOfMonth(date: string): string {
  return date.slice(0, 8) + "01";
}

export function addMonths(date: string, months: number): string {
  const [y, m] = date.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return fromUTC(d.getTime());
}

export function daysInMonth(date: string): number {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0=日曜 */
export function weekday(date: string): number {
  return new Date(toUTC(date)).getUTCDay();
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatJa(date: string, withYear = false): string {
  const [y, m, d] = date.split("-").map(Number);
  const w = WEEKDAYS[weekday(date)];
  return withYear ? `${y}/${m}/${d}(${w})` : `${m}/${d}(${w})`;
}

export function weekdayLabel(i: number): string {
  return WEEKDAYS[i];
}

export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUTC(toUTC(s)) === s;
}
