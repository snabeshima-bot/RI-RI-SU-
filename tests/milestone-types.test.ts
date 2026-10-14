import { describe, expect, it } from "vitest";
import { parseMilestoneTypes, toggleMilestoneType } from "@/lib/milestones";

describe("parseMilestoneTypes", () => {
  it("有効な種類だけを定義順で返す", () => {
    expect(parseMilestoneTypes("recording,demoDeadline,bogus")).toEqual(["demoDeadline", "recording"]);
    expect(parseMilestoneTypes(undefined)).toEqual([]);
    expect(parseMilestoneTypes("")).toEqual([]);
  });
});

describe("toggleMilestoneType", () => {
  it("オン/オフを切り替える", () => {
    expect(toggleMilestoneType([], "recording")).toEqual(["recording"]);
    expect(toggleMilestoneType(["recording"], "demoDeadline")).toEqual(["demoDeadline", "recording"]);
    expect(toggleMilestoneType(["demoDeadline", "recording"], "recording")).toEqual(["demoDeadline"]);
  });
});
