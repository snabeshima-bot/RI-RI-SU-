export const CREDIT_ROLES = [
  { key: "lyrics", label: "作詞" },
  { key: "composition", label: "作曲" },
  { key: "arrangement", label: "編曲" },
] as const;

export type CreditRole = (typeof CREDIT_ROLES)[number]["key"];

export type TrackCredits = Record<CreditRole, number[]>;

export function emptyCredits(): TrackCredits {
  return { lyrics: [], composition: [], arrangement: [] };
}

export function isCreditRole(role: string): role is CreditRole {
  return CREDIT_ROLES.some((r) => r.key === role);
}
