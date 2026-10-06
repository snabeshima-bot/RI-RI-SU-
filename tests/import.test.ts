import { describe, expect, it } from "vitest";
import { headerToField, parseDateCell, parseSheet } from "@/lib/import";

const TODAY = "2026-10-06";

describe("headerToField", () => {
  it("表記ゆれを吸収する", () => {
    expect(headerToField("データ入稿日")).toBe("musicSubmission");
    expect(headerToField("ジャケット入稿日")).toBe("jacketSubmission");
    expect(headerToField("カラオケ配信データ入稿日")).toBe("karaokeSubmission");
    expect(headerToField("カラオケ配信日")).toBe("karaokeRelease");
    expect(headerToField("ティザー 公開")).toBe("teaserRelease");
    expect(headerToField("リリース日")).toBe("release");
    expect(headerToField("曲名")).toBe("title");
    expect(headerToField("備考")).toBeNull();
  });
});

describe("parseDateCell", () => {
  it("年なしは近い将来の年として扱う", () => {
    expect(parseDateCell("11/5", TODAY)).toBe("2026-11-05");
    expect(parseDateCell("1/5", TODAY)).toBe("2027-01-05");
    expect(parseDateCell("9/1", TODAY)).toBe("2026-09-01");
  });
  it("年あり・和式・空欄・不正", () => {
    expect(parseDateCell("2027/3/5", TODAY)).toBe("2027-03-05");
    expect(parseDateCell("12月11日", TODAY)).toBe("2026-12-11");
    expect(parseDateCell("", TODAY)).toBeNull();
    expect(parseDateCell("未定", TODAY)).toBeNull();
    expect(parseDateCell("2/30", TODAY)).toBe("invalid");
    expect(parseDateCell("来月", TODAY)).toBe("invalid");
  });
});

describe("parseSheet", () => {
  it("スプレッドシートの貼り付けを行に変換する", () => {
    const text = "曲名\tリリース日\tデータ入稿日\tジャケット入稿日\tティザー公開\tティザー撮影\n1\t11/5\t10/15\t10/22\t11/4\t10/28\n3\t1/5\t12/11\t12/19\t1/4\t12/28\n";
    const r = parseSheet(text, TODAY);
    expect(r.error).toBeUndefined();
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({
      title: "新曲1(仮)",
      dates: { release: "2026-11-05", musicSubmission: "2026-10-15", jacketSubmission: "2026-10-22", teaserRelease: "2026-11-04", teaserShoot: "2026-10-28" },
      errors: [],
    });
    expect(r.rows[1].title).toBe("新曲3(仮)");
    expect(r.rows[1].dates.musicSubmission).toBe("2026-12-11");
    expect(r.rows[1].dates.release).toBe("2027-01-05");
  });
  it("日付の列が無ければエラー", () => {
    expect(parseSheet("曲名\t備考\nA\tB", TODAY).error).toBeDefined();
  });
});
