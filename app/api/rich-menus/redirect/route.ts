import { NextResponse } from "next/server";

import { isAllowedHttpUrl } from "@/lib/auth-redirect";
import { prisma } from "@/lib/prisma";
import { verifyTrackingTarget } from "@/lib/tracking-redirect";

const FALLBACK = "https://line.me/";

/** tel:/mailto: cannot use HTTP 302 — open via HTML + location.href after click is logged. */
function respondToTarget(target: string): NextResponse {
  if (isAllowedHttpUrl(target)) {
    return NextResponse.redirect(target, { status: 302 });
  }

  const href = JSON.stringify(target);
  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title></title></head><body><p><a href=${href}>เปิดต่อ</a></p><script>location.href=${href}</script></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const channelId = url.searchParams.get("channelId");
  const richMenuId = url.searchParams.get("richMenuId");
  const areaIndex = url.searchParams.get("areaIndex");
  const target = url.searchParams.get("target");
  const sig = url.searchParams.get("sig");

  const redirectTo =
    channelId &&
    richMenuId &&
    areaIndex != null &&
    target &&
    verifyTrackingTarget({ channelId, richMenuId, areaIndex, target }, sig)
      ? target
      : FALLBACK;

  if (!channelId || !richMenuId || !areaIndex) {
    return respondToTarget(redirectTo);
  }

  const index = Number.parseInt(areaIndex, 10);

  if (Number.isNaN(index) || index < 0) {
    return respondToTarget(redirectTo);
  }

  // Only log when signature is valid (redirectTo === target)
  if (redirectTo === target) {
    try {
      const lineAccount = await prisma.lineAccount.findUnique({
        where: { channelId },
        select: { id: true },
      });

      if (lineAccount) {
        const menu = await prisma.richMenu.findFirst({
          where: { id: richMenuId, lineAccountId: lineAccount.id },
          select: { id: true },
        });

        if (menu) {
          await prisma.clickEvent.create({
            data: {
              lineAccountId: lineAccount.id,
              richMenuId,
              areaIndex: index,
              lineUserId: "anonymous",
            },
          });
        }
      }
    } catch {
      // ไม่ให้ logging error ขัดขวางการ redirect ไปยังปลายทางจริง
    }
  }

  return respondToTarget(redirectTo);
}
