import { JWT } from "google-auth-library";
import { addDays } from "./dates";
import { MILESTONE_LIST, type MilestoneSource } from "./milestones";

const API = "https://www.googleapis.com/calendar/v3/calendars";

export function gcalConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_CALENDAR_ID);
}

export function gcalSubscribeUrl(): string | null {
  const id = process.env.GOOGLE_CALENDAR_ID;
  return id ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(id)}` : null;
}

let client: JWT | null = null;
function getClient(): JWT {
  if (!client) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
    client = new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
    });
  }
  return client;
}

async function call(method: string, path: string, data?: unknown) {
  const url = `${API}/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!)}/events${path}`;
  return getClient().request<{ id: string }>({ url, method, data, validateStatus: () => true });
}

export type GcalRelease = MilestoneSource & {
  id: number;
  title: string;
  artistName: string;
  gcalEventIds: Record<string, string>;
};

/**
 * リリースの各日付を共有カレンダーの終日予定として作成/更新/削除する。
 * 戻り値は新しいイベントIDの対応表とエラーメッセージ(成功時 null)。
 */
export async function syncReleaseToCalendar(
  r: GcalRelease,
  appUrl: string,
): Promise<{ eventIds: Record<string, string>; error: string | null }> {
  if (!gcalConfigured()) return { eventIds: r.gcalEventIds, error: null };
  const eventIds = { ...r.gcalEventIds };
  const errors: string[] = [];

  for (const m of MILESTONE_LIST) {
    const date = r[m.key];
    const existing = eventIds[m.key];
    try {
      if (!date) {
        if (existing) {
          const res = await call("DELETE", `/${existing}`);
          if (res.status >= 400 && res.status !== 404 && res.status !== 410) throw new Error(`HTTP ${res.status}`);
          delete eventIds[m.key];
        }
        continue;
      }
      const done = m.doneKey ? r[m.doneKey] : false;
      const body = {
        summary: `${done ? "✅ " : ""}[${m.short}] ${r.artistName}「${r.title}」`,
        description: `${m.label}\n${appUrl}/releases/${r.id}`,
        start: { date },
        end: { date: addDays(date, 1) },
        transparency: "transparent",
      };
      if (existing) {
        const res = await call("PATCH", `/${existing}`, body);
        if (res.status < 400) continue;
        if (res.status !== 404 && res.status !== 410) throw new Error(`HTTP ${res.status}`);
      }
      const res = await call("POST", "", body);
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      eventIds[m.key] = res.data.id;
    } catch (e) {
      errors.push(`${m.short}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { eventIds, error: errors.length ? `Googleカレンダー同期に失敗しました(${errors.join(", ")})` : null };
}

export async function deleteReleaseFromCalendar(eventIds: Record<string, string>): Promise<void> {
  if (!gcalConfigured()) return;
  await Promise.allSettled(Object.values(eventIds).map((id) => call("DELETE", `/${id}`)));
}
