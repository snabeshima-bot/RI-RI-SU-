import { describe, expect, it } from "vitest";
import { isAllowedGoogleProfile } from "@/lib/domain";

const D = "focpro.co.jp";

describe("isAllowedGoogleProfile", () => {
  it("許可ドメインのWorkspaceアカウントは許可", () => {
    expect(isAllowedGoogleProfile({ email: "taro@focpro.co.jp", email_verified: true, hd: "focpro.co.jp" }, D)).toBe(true);
    expect(isAllowedGoogleProfile({ email: "Taro@FOCPRO.co.jp", email_verified: true, hd: "FOCPRO.CO.JP" }, D)).toBe(true);
  });
  it("gmail.com は拒否", () => {
    expect(isAllowedGoogleProfile({ email: "taro@gmail.com", email_verified: true }, D)).toBe(false);
  });
  it("hd が無い/異なる場合は拒否(メールだけ一致しても不可)", () => {
    expect(isAllowedGoogleProfile({ email: "taro@focpro.co.jp", email_verified: true }, D)).toBe(false);
    expect(isAllowedGoogleProfile({ email: "taro@focpro.co.jp", email_verified: true, hd: "evil.com" }, D)).toBe(false);
  });
  it("hd を偽装してもメールが別ドメインなら拒否", () => {
    expect(isAllowedGoogleProfile({ email: "taro@evil.com", email_verified: true, hd: "focpro.co.jp" }, D)).toBe(false);
    expect(isAllowedGoogleProfile({ email: "taro@focpro.co.jp.evil.com", email_verified: true, hd: "focpro.co.jp" }, D)).toBe(false);
  });
  it("メール未確認は拒否", () => {
    expect(isAllowedGoogleProfile({ email: "taro@focpro.co.jp", email_verified: false, hd: "focpro.co.jp" }, D)).toBe(false);
    expect(isAllowedGoogleProfile(null, D)).toBe(false);
  });
});
