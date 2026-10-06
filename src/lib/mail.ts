import { Resend } from "resend";
import { formatJa } from "./dates";
import { MILESTONES } from "./milestones";
import { REMIND_DAYS_BEFORE, type DueItem } from "./reminders";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function renderReminderEmail(items: DueItem[], appUrl: string) {
  const date = items[0].date;
  const subject = `【リマインド】${formatJa(date)} の締切・配信予定 ${items.length}件(${REMIND_DAYS_BEFORE}日前)`;
  const rows = items
    .map((d) => {
      const m = MILESTONES[d.milestone];
      const url = `${appUrl}/releases/${d.releaseId}`;
      return `<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap">
    <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${m.soft};color:${m.color};font-size:12px;font-weight:600">${m.short}</span>
  </td>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">${escapeHtml(d.artistName)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0"><a href="${url}" style="color:#0f172a;font-weight:600;text-decoration:none">${escapeHtml(d.releaseTitle)}</a></td>
</tr>`;
    })
    .join("\n");
  const html = `<div style="font-family:-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
  <h2 style="font-size:18px;margin:0 0 4px">${REMIND_DAYS_BEFORE}日後(${formatJa(date, true)})の予定</h2>
  <p style="color:#64748b;font-size:13px;margin:0 0 16px">以下の入稿・配信が近づいています。</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
  <p style="margin-top:20px"><a href="${appUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:14px">リリース管理を開く</a></p>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px">通知の設定は <a href="${appUrl}/settings" style="color:#94a3b8">通知設定</a> から変更できます。</p>
</div>`;
  const text = items.map((d) => `・[${MILESTONES[d.milestone].short}] ${d.artistName}「${d.releaseTitle}」 ${appUrl}/releases/${d.releaseId}`).join("\n");
  return { subject, html, text };
}

export async function sendMail(to: string, mail: { subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY が設定されていません");
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM || "リリース管理 <noreply@focpro.co.jp>",
    to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  if (error) throw new Error(`${error.name}: ${error.message}`);
}
