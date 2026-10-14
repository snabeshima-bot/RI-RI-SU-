import { describe, expect, it } from "vitest";
import { releasePhase, releaseSteps } from "@/lib/phase";
import { buildTimeline } from "@/lib/timeline";

const base = {
  release: null as string | null,
  musicSubmission: null as string | null,
  jacketSubmission: null as string | null,
  karaokeRelease: null as string | null,
  karaokeSubmission: null as string | null,
  demoDeadline: null as string | null,
  recording: null as string | null,
  utawariFix: null as string | null,
  firstPerformance: null as string | null,
  liveDeadline: null as string | null,
  masterDeadline: null as string | null,
  teaserShoot: null as string | null,
  teaserRelease: null as string | null,
  demoSubmitted: false,
  utawariFixed: false,
  liveSubmitted: false,
  masterSubmitted: false,
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
  const full = {
    ...base,
    demoDeadline: "2026-09-01",
    recording: "2026-09-10",
    masterDeadline: "2026-09-20",
    musicSubmission: "2026-10-01",
    jacketSubmission: "2026-10-01",
    karaokeSubmission: "2026-10-01",
    release: "2026-11-05",
    karaokeRelease: "2026-11-20",
  };
  it("日付が無ければ日程未定", () => {
    expect(releasePhase({ ...base }, TODAY)).toBe("unscheduled");
  });
  it("DEMO・MASTER未提出、またはRECが今日以降なら制作中", () => {
    expect(releasePhase(full, TODAY)).toBe("production");
    expect(releasePhase({ ...full, demoSubmitted: true }, TODAY)).toBe("production");
    expect(releasePhase({ ...full, demoSubmitted: true, masterSubmitted: true, recording: "2026-10-07" }, TODAY)).toBe("production");
  });
  it("歌割FIX未確定・Live未提出なら制作中", () => {
    const made = { ...full, demoSubmitted: true, masterSubmitted: true };
    expect(releasePhase({ ...made, utawariFix: "2026-09-15" }, TODAY)).toBe("production");
    expect(releasePhase({ ...made, liveDeadline: "2026-09-15" }, TODAY)).toBe("production");
    expect(releasePhase({ ...made, utawariFix: "2026-09-15", utawariFixed: true }, TODAY)).toBe("submission");
  });
  it("制作が済んで入稿が残っていれば入稿待ち", () => {
    const made = { ...full, demoSubmitted: true, masterSubmitted: true };
    expect(releasePhase(made, TODAY)).toBe("submission");
    expect(releasePhase({ ...made, musicSubmitted: true, jacketSubmitted: true }, TODAY)).toBe("submission");
  });
  it("入稿がすべて済めばリリース待ち、カラオケ配信まで終わればリリース済み", () => {
    const done = { ...full, demoSubmitted: true, masterSubmitted: true, musicSubmitted: true, jacketSubmitted: true, karaokeSubmitted: true };
    expect(releasePhase(done, TODAY)).toBe("waiting");
    expect(releasePhase({ ...done, release: "2026-10-01" }, TODAY)).toBe("waiting");
    expect(releasePhase({ ...done, release: "2026-10-01", karaokeRelease: "2026-10-06" }, TODAY)).toBe("released");
  });
  it("日付の無い工程は判定から外す", () => {
    expect(releasePhase({ ...base, release: "2026-11-05", musicSubmission: "2026-10-15" }, TODAY)).toBe("submission");
    expect(releasePhase({ ...base, release: "2026-11-05" }, TODAY)).toBe("waiting");
    expect(releasePhase({ ...base, release: "2026-10-01" }, TODAY)).toBe("released");
    expect(releasePhase({ ...base, recording: "2026-10-20" }, TODAY)).toBe("production");
    expect(releasePhase({ ...base, recording: "2026-09-20" }, TODAY)).toBe("waiting");
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
