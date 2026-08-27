import { ruleToOutgoingMessage } from "./auto-response";
import { replyMessage } from "./client";
import { findMatchingRule } from "./keyword-match";

import { decryptSecret } from "@/lib/secrets";
import { prisma } from "@/lib/prisma";

type AutoResponseAccount = {
  id: string;
  accessToken: string;
  autoResponseEnabled: boolean;
  fallbackMessage: string | null;
};

type TextMessageEvent = {
  replyToken?: string;
  source?: { type?: string; userId?: string };
  message?: { text?: string };
};

export async function handleAutoResponse(
  lineAccount: AutoResponseAccount,
  event: TextMessageEvent,
): Promise<void> {
  if (!lineAccount.autoResponseEnabled) return;
  if (event.source?.type !== "user" || !event.source.userId) return;
  if (!event.replyToken) return;

  const rawText = event.message?.text ?? "";

  if (!rawText.trim()) return;

  const rules = await prisma.keywordResponseRule.findMany({
    where: { lineAccountId: lineAccount.id, isEnabled: true },
  });

  const match = findMatchingRule(rules, rawText);
  const accessToken = decryptSecret(lineAccount.accessToken);

  if (match) {
    const msg = ruleToOutgoingMessage(match);

    if (!msg) return;

    try {
      await replyMessage(accessToken, event.replyToken, [msg]);
    } catch {
      // reply token expired or LINE API error
    }

    return;
  }

  await prisma.unmatchedMessage.create({
    data: {
      lineAccountId: lineAccount.id,
      lineUserId: event.source.userId,
      messageText: rawText,
    },
  });

  const fallback = lineAccount.fallbackMessage?.trim();

  if (!fallback) return;

  try {
    await replyMessage(accessToken, event.replyToken, [
      { type: "text", text: fallback },
    ]);
  } catch {
    // reply token expired or LINE API error
  }
}
