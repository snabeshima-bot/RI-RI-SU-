import { describe, expect, it } from "vitest";
import { releasePhase, releaseSteps } from "@/lib/phase";
import { buildTimeline } from "@/lib/timeline";

const base = {
  release: null as string | null,
  musicSubmission: null as string | null,
  jacketSubmission: null as string | null,
  karaokeRelease: null as string | null,
  karaokeSubmission: null as string | null,
  teaserShoot: null as string | null,
  teaserRelease: null as string | null,
  musicSubmitted: false,
  jacketSubmitted: false,
  karaokeSubmitted: false,
};
const TODAY = "2026-10-07";

describe("buildTimeline", () => {
  const rs = [
    { ...base, id: 1, release: "2026-11-05", musicSubmission: "2026-10-15", jacketSubmission: "2026-10-15" },
    { ...base, id: 2, release: "2026-09-01", teaserShoot: "2026-09-30" },
  ];
  it("月→日→予定にまとめ、14日より前は除く", () => {
    const t = buildTimeline(rs, TODAY, false);
    expect(t.map((m) => m.month)).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(t[0].days.map((d) => d.date)).toEqual(["2026-09-30"]);
    expect(t[1].days).toHaveLength(1);
    expect(t[1].days[0].entries.map((e) => e.key)).toEqual(["musicSubmission", "jacketSubmission"]);
  });
  it("showPast で全期間", () => {
    expect(buildTimeline(rs, TODAY, true)[0].days[0].date).toBe("2026-09-01");
  });
});

describe("releasePhase", () => {
  it("4段階を判定する", () => {
    expect(releasePhase({ ...base }, TODAY)).toBe("unscheduled");
    expect(releasePhase({ ...base, release: "2026-10-07" }, TODAY)).toBe("released");
    expect(releasePhase({ ...base, release: "2026-11-05" }, TODAY)).toBe("production");
    expect(releasePhase({ ...base, release: "2026-11-05", musicSubmission: "2026-10-15", jacketSubmission: "2026-10-22", musicSubmitted: true }, TODAY)).toBe("production");
    expect(
      releasePhase({ ...base, release: "2026-11-05", musicSubmission: "2026-10-15", jacketSubmission: "2026-10-22", musicSubmitted: true, jacketSubmitted: true }, TODAY),
    ).toBe("waiting");
    expect(releasePhase({ ...base, release: "2026-11-05", musicSubmission: "2026-10-15", musicSubmitted: true }, TODAY)).toBe("waiting");
  });
});

describe("releaseSteps", () => {
  it("完了・次・未着手を付ける", () => {
    const steps = releaseSteps(
      { ...base, release: "2026-11-05", musicSubmission: "2026-10-01", musicSubmitted: true, teaserShoot: "2026-10-05", jacketSubmission: "2026-10-03" },
      TODAY,
    );
    expect(steps.map((s) => `${s.key}:${s.state}`)).toEqual([
      "musicSubmission:done",
      "jacketSubmission:next",
      "teaserShoot:done",
      "release:todo",
    ]);
  });
});
