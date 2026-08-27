import { NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@/app/generated/prisma/client";
import {
  keywordResponseRuleByIdWhere,
  lineAccountByIdWhere,
} from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { buildStoredKeywordRulePayload } from "@/lib/line/keyword-rule-payload";
import { createKeywordRuleSchema } from "@/lib/line/message-schema";
import { prisma } from "@/lib/prisma";

const toggleSchema = z.object({
  isEnabled: z.boolean(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const { id, ruleId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: { id: true },
  });

  if (!account) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  const rule = await prisma.keywordResponseRule.findFirst({
    where: keywordResponseRuleByIdWhere(user, ruleId),
    select: {
      id: true,
      lineAccountId: true,
      keyword: true,
      isEnabled: true,
      responseType: true,
      flexSource: true,
      responsePayload: true,
    },
  });

  if (!rule || rule.lineAccountId !== account.id) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  return NextResponse.json({ rule });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const { id, ruleId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: { id: true },
  });

  if (!account) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  const existing = await prisma.keywordResponseRule.findFirst({
    where: keywordResponseRuleByIdWhere(user, ruleId),
    select: { id: true, lineAccountId: true },
  });

  if (!existing || existing.lineAccountId !== account.id) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  const body = await request.json();

  if (Object.keys(body).length === 1 && typeof body.isEnabled === "boolean") {
    const toggle = toggleSchema.parse(body);
    const rule = await prisma.keywordResponseRule.update({
      where: { id: existing.id },
      data: { isEnabled: toggle.isEnabled },
      select: {
        id: true,
        keyword: true,
        isEnabled: true,
        responseType: true,
        flexSource: true,
      },
    });

    return NextResponse.json({ rule });
  }

  const parsed = createKeywordRuleSchema.safeParse(body);

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .join(", ");

    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let stored;

  try {
    stored = buildStoredKeywordRulePayload(parsed.data);
  } catch (e) {
    const message =
      e instanceof Error && e.message === "EMPTY_KEYWORD"
        ? "กรุณาระบุ keyword"
        : "Flex JSON ไม่ถูกต้อง";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const rule = await prisma.keywordResponseRule.update({
      where: { id: existing.id },
      data: stored,
      select: {
        id: true,
        keyword: true,
        isEnabled: true,
        responseType: true,
        flexSource: true,
      },
    });

    return NextResponse.json({ rule });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "keyword นี้มีอยู่แล้ว" },
        { status: 409 },
      );
    }

    throw e;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const { id, ruleId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.lineAccount.findFirst({
    where: lineAccountByIdWhere(user, id),
    select: { id: true },
  });

  if (!account) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  const existing = await prisma.keywordResponseRule.findFirst({
    where: keywordResponseRuleByIdWhere(user, ruleId),
    select: { id: true, lineAccountId: true },
  });

  if (!existing || existing.lineAccountId !== account.id) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  await prisma.keywordResponseRule.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
