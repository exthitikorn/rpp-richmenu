import { createHmac, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";

function verifySignature(
  body: string,
  channelSecret: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const hash = createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);

  if (a.length !== b.length) return false;

  return timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
}

/**
 * คลิกจาก Rich Menu: ใช้ postback data รูปแบบ "rpp:richMenuId:areaIndex"
 * เพื่อให้ webhook บันทึก ClickEvent ได้
 */
function parseClickData(
  data: string,
): { richMenuId: string; areaIndex: number } | null {
  const parts = data.split(":");

  if (parts.length !== 3 || parts[0] !== "rpp") return null;
  const areaIndex = parseInt(parts[2], 10);

  if (Number.isNaN(areaIndex) || areaIndex < 0) return null;

  return { richMenuId: parts[1], areaIndex };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;
  const signature =
    request.headers.get("x-line-signature") ??
    request.headers.get("X-Line-Signature");

  const rawBody = await request.text();
  const lineAccount = await prisma.lineAccount.findUnique({
    where: { channelId },
    select: { id: true, channelSecret: true },
  });

  if (!lineAccount) {
    return NextResponse.json({ error: "Unknown channel" }, { status: 404 });
  }

  const channelSecret = decryptSecret(lineAccount.channelSecret);

  if (!verifySignature(rawBody, channelSecret, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: {
    events?: Array<{
      type: string;
      source?: { userId?: string };
      postback?: { data?: string };
    }>;
  };

  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = body.events ?? [];

  for (const event of events) {
    if (
      event.type !== "postback" ||
      !event.source?.userId ||
      !event.postback?.data
    )
      continue;
    const parsed = parseClickData(event.postback.data);

    if (!parsed) continue;

    const menu = await prisma.richMenu.findFirst({
      where: {
        id: parsed.richMenuId,
        lineAccountId: lineAccount.id,
      },
      select: { id: true },
    });

    if (!menu) continue;

    await prisma.clickEvent.create({
      data: {
        lineAccountId: lineAccount.id,
        richMenuId: parsed.richMenuId,
        areaIndex: parsed.areaIndex,
        lineUserId: event.source.userId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
