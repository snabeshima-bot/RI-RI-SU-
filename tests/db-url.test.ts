import { describe, expect, it } from "vitest";
import { databaseUrl } from "@/db/url";

describe("databaseUrl", () => {
  it("DATABASE_URL を優先", () => {
    expect(databaseUrl({ DATABASE_URL: "a", POSTGRES_URL: "b" })).toBe("a");
    expect(databaseUrl({ POSTGRES_URL: "b" })).toBe("b");
  });
  it("接頭辞付きの変数も探す", () => {
    expect(databaseUrl({ STORAGE_DATABASE_URL: "c" })).toBe("c");
    expect(databaseUrl({ NEON_POSTGRES_URL: "d" })).toBe("d");
  });
  it("見つからなければ undefined", () => {
    expect(databaseUrl({ DATABASE_URL_UNPOOLED: "x" })).toBeUndefined();
  });
});
