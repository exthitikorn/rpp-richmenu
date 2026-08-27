import type { KeywordResponseRule } from "@/app/generated/prisma/client";

export function normalizeKeyword(text: string): string {
  return text.trim().toLowerCase();
}

export function findMatchingRule(
  rules: KeywordResponseRule[],
  incomingText: string,
): KeywordResponseRule | null {
  const normalized = normalizeKeyword(incomingText);

  if (!normalized) return null;

  return (
    rules.find((rule) => rule.isEnabled && rule.keyword === normalized) ?? null
  );
}
