import { NextResponse } from "next/server";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { autoResponseSettingsSchema } from "@/lib/line/message-schema";
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
    select: { autoResponseEnabled: true, fallbackMessage: true },
  });

  if (!account) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  }

  return NextResponse.json(account);
}

export async function PATCH(
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
  const parsed = autoResponseSettingsSchema.safeParse(body);

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .join(", ");

    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { autoResponseEnabled, fallbackMessage } = parsed.data;

  const updated = await prisma.lineAccount.update({
    where: { id: account.id },
    data: {
      autoResponseEnabled,
      ...(fallbackMessage !== undefined ? { fallbackMessage } : {}),
    },
    select: { autoResponseEnabled: true, fallbackMessage: true },
  });

  return NextResponse.json(updated);
}
