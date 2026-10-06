import { describe, expect, it } from "vitest";
import { buildDigests, collectDue, type ReminderRelease } from "@/lib/reminders";

const base = {
  release: null,
  musicSubmission: null,
  jacketSubmission: null,
  karaokeRelease: null,
  karaokeSubmission: null,
  musicSubmitted: false,
  jacketSubmitted: false,
  karaokeSubmitted: false,
};

const releases: ReminderRelease[] = [
  { ...base, id: 1, title: "A", artistId: 10, artistName: "X", release: "2026-10-09", musicSubmission: "2026-10-09" },
  { ...base, id: 2, title: "B", artistId: 20, artistName: "Y", jacketSubmission: "2026-10-09", jacketSubmitted: true },
  { ...base, id: 3, title: "C", artistId: 20, artistName: "Y", karaokeRelease: "2026-10-09", karaokeSubmission: "2026-10-08" },
];

describe("collectDue", () => {
  it("対象日のマイルストーンを抽出し、入稿済みは除外する", () => {
    const due = collectDue(releases, "2026-10-09");
    expect(due.map((d) => `${d.releaseId}:${d.milestone}`).sort()).toEqual(["1:musicSubmission", "1:release", "3:karaokeRelease"]);
  });
});

describe("buildDigests", () => {
  it("購読アーティストごと・全体購読でまとめる", () => {
    const due = collectDue(releases, "2026-10-09");
    const digests = buildDigests(due, [
      { email: "all@x", notifyAll: true, artistIds: [] },
      { email: "x@x", notifyAll: false, artistIds: [10] },
      { email: "y@x", notifyAll: false, artistIds: [20] },
      { email: "none@x", notifyAll: false, artistIds: [] },
    ]);
    expect(digests.get("all@x")).toHaveLength(3);
    expect(digests.get("x@x")).toHaveLength(2);
    expect(digests.get("y@x")).toHaveLength(1);
    expect(digests.has("none@x")).toBe(false);
  });
});
