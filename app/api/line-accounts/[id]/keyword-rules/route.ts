import { NextResponse } from "next/server";

import { Prisma } from "@/app/generated/prisma/client";
import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { buildStoredKeywordRulePayload } from "@/lib/line/keyword-rule-payload";
import { createKeywordRuleSchema } from "@/lib/line/message-schema";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const rules = await prisma.keywordResponseRule.findMany({
    where: { lineAccountId: account.id },
    orderBy: { keyword: "asc" },
    select: {
      id: true,
      keyword: true,
      isEnabled: true,
      responseType: true,
      flexSource: true,
    },
  });

  return NextResponse.json({ rules });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const body = await request.json();
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
    const rule = await prisma.keywordResponseRule.create({
      data: {
        lineAccountId: account.id,
        ...stored,
      },
      select: {
        id: true,
        keyword: true,
        isEnabled: true,
        responseType: true,
        flexSource: true,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
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
