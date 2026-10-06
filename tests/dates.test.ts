import { describe, expect, it } from "vitest";
import { addDays, addMonths, diffDays, formatJa, todayJST } from "@/lib/dates";

describe("dates", () => {
  it("todayJST は日本時間で日付が変わる", () => {
    expect(todayJST(new Date("2026-10-05T14:59:59Z"))).toBe("2026-10-05");
    expect(todayJST(new Date("2026-10-05T15:00:00Z"))).toBe("2026-10-06");
  });
  it("addDays は月・年をまたぐ", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("diffDays / addMonths / formatJa", () => {
    expect(diffDays("2026-10-09", "2026-10-06")).toBe(3);
    expect(addMonths("2026-11-01", 3)).toBe("2027-02-01");
    expect(formatJa("2026-10-06")).toBe("10/6(火)");
  });
});
