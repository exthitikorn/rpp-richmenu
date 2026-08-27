import type { KeywordResponseRule } from "@/app/generated/prisma/client";
import type { LineOutgoingMessage } from "./types";

type TextPayload = { text: string };
type FlexPayload = { altText: string; contents: Record<string, unknown> };

export function ruleToOutgoingMessage(
  rule: Pick<KeywordResponseRule, "responseType" | "responsePayload">,
): LineOutgoingMessage | null {
  const payload = rule.responsePayload as TextPayload | FlexPayload;

  if (rule.responseType === "TEXT") {
    const text = (payload as TextPayload).text?.trim();

    if (!text) return null;

    return { type: "text", text };
  }

  const flex = payload as FlexPayload;

  if (!flex.altText?.trim() || !flex.contents) return null;

  return {
    type: "flex",
    altText: flex.altText.trim(),
    contents: flex.contents,
  };
}
