import { describe, expect, it } from "vitest";
import { applyDeadlineDefaults, deadlineHint, scheduleWarnings } from "@/lib/schedule-rules";

describe("applyDeadlineDefaults", () => {
  it("未入力の期限に基準日を入れる", () => {
    const r = applyDeadlineDefaults({ musicSubmission: "2026-11-04", firstPerformance: "2026-11-20", masterDeadline: null, liveDeadline: null });
    expect(r.masterDeadline).toBe("2026-11-04");
    expect(r.liveDeadline).toBe("2026-11-20");
  });
  it("入力済み・基準日なしなら変えない", () => {
    const r = applyDeadlineDefaults({ musicSubmission: "2026-11-04", masterDeadline: "2026-10-30", liveDeadline: null, firstPerformance: null });
    expect(r.masterDeadline).toBe("2026-10-30");
    expect(r.liveDeadline).toBeNull();
  });
});

describe("scheduleWarnings", () => {
  it("期限が基準日より後なら警告", () => {
    const w = scheduleWarnings({ masterDeadline: "2026-11-10", musicSubmission: "2026-11-04", liveDeadline: "2026-11-20", firstPerformance: "2026-11-20" });
    expect(w).toHaveLength(1);
    expect(w[0]).toContain("MASTER音源");
    expect(w[0]).toContain("楽曲データ入稿");
  });
  it("Live音源が初披露日より後", () => {
    expect(scheduleWarnings({ liveDeadline: "2026-11-21", firstPerformance: "2026-11-20" })[0]).toContain("初披露");
  });
  it("ヒント", () => {
    expect(deadlineHint("masterDeadline")).toBe("楽曲データ入稿日までに");
    expect(deadlineHint("liveDeadline")).toBe("初披露日までに");
    expect(deadlineHint("release")).toBeNull();
  });
});
