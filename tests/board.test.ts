import { describe, expect, it } from "vitest";
import { groupByMonth, monthLabel } from "@/lib/board";

const base = {
  release: null,
  musicSubmission: null,
  jacketSubmission: null,
  karaokeRelease: null,
  karaokeSubmission: null,
  teaserShoot: null,
  teaserRelease: null,
  musicSubmitted: false,
  jacketSubmitted: false,
  karaokeSubmitted: false,
};

describe("groupByMonth", () => {
  it("月ごとに日付順で振り分け、範囲外は除く", () => {
    const rs = [
      { ...base, id: 1, release: "2026-11-05", musicSubmission: "2026-10-15", teaserShoot: "2026-10-28" },
      { ...base, id: 2, release: "2027-01-05", jacketSubmission: "2026-10-03", musicSubmitted: true },
      { ...base, id: 3, release: "2026-09-01" },
    ];
    const cols = groupByMonth(rs, "2026-10-07", 3);
    expect(cols.map((c) => c.month)).toEqual(["2026-10", "2026-11", "2026-12"]);
    expect(cols[0].items.map((i) => `${i.release.id}:${i.key}`)).toEqual(["2:jacketSubmission", "1:musicSubmission", "1:teaserShoot"]);
    expect(cols[1].items).toHaveLength(1);
    expect(cols[2].items).toHaveLength(0);
  });
  it("monthLabel", () => {
    expect(monthLabel("2027-01")).toBe("2027年1月");
    expect(monthLabel("2027-01", false)).toBe("1月");
  });
});
