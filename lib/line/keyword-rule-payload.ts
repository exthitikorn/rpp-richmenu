import type {
  FlexMessageSource,
  KeywordResponseType,
  Prisma,
} from "@/app/generated/prisma/client";
import type { z } from "zod";

import { buildFlexPayloadFromForm } from "./flex-builder";
import { normalizeKeyword } from "./keyword-match";
import {
  createKeywordRuleSchema,
  storedFlexPayloadSchema,
  storedTextPayloadSchema,
} from "./message-schema";

export type StoredKeywordRulePayload = {
  keyword: string;
  isEnabled: boolean;
  responseType: KeywordResponseType;
  responsePayload: Prisma.InputJsonValue;
  flexSource: FlexMessageSource | null;
};

export function buildStoredKeywordRulePayload(
  parsed: z.infer<typeof createKeywordRuleSchema>,
): StoredKeywordRulePayload {
  const keyword = normalizeKeyword(parsed.keyword);

  if (!keyword) {
    throw new Error("EMPTY_KEYWORD");
  }

  if (parsed.responseType === "TEXT") {
    const payload = storedTextPayloadSchema.parse({ text: parsed.text });

    return {
      keyword,
      isEnabled: parsed.isEnabled ?? true,
      responseType: "TEXT",
      responsePayload: payload as Prisma.InputJsonValue,
      flexSource: null,
    };
  }

  let flexPayload;

  try {
    flexPayload = buildFlexPayloadFromForm(parsed.flex!);
  } catch {
    throw new Error("INVALID_FLEX");
  }

  const payload = storedFlexPayloadSchema.parse(flexPayload);
  const flexSource = parsed.flex!.pattern === "json" ? "JSON" : "FORM";

  return {
    keyword,
    isEnabled: parsed.isEnabled ?? true,
    responseType: "FLEX",
    responsePayload: payload as Prisma.InputJsonValue,
    flexSource,
  };
}
