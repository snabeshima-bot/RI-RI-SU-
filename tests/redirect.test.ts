import { describe, expect, it } from "vitest";
import { migratedUrl } from "@/lib/redirect";

describe("migratedUrl", () => {
  it("未設定なら転送しない", () => {
    expect(migratedUrl(undefined, "/", "")).toBeNull();
  });
  it("旧URLを /release 配下へ", () => {
    expect(migratedUrl("https://nrc.example.com/", "/", "?view=board")).toBe("https://nrc.example.com/release?view=board");
    expect(migratedUrl("https://nrc.example.com", "/releases/12", "")).toBe("https://nrc.example.com/release/releases/12");
    expect(migratedUrl("https://nrc.example.com", "/artists", "")).toBe("https://nrc.example.com/release/artists");
  });
});
