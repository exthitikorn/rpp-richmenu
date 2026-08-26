import { unlink } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { richMenuByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteRichMenu } from "@/lib/line/client";
import { decryptSecret } from "@/lib/secrets";

const bodySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  chatBarText: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const richMenu = await prisma.richMenu.findFirst({
      where: richMenuByIdWhere(user, id),
      select: { id: true },
    });

    if (!richMenu) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Rich Menu หรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const { name, chatBarText } = parsed.data;

    await prisma.richMenu.update({
      where: { id },
      data: {
        name,
        ...(chatBarText !== undefined && { chatBarText }),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "แก้ไข Rich Menu ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const richMenu = await prisma.richMenu.findFirst({
      where: richMenuByIdWhere(user, id),
      include: {
        lineAccount: true,
      },
    });

    if (!richMenu) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Rich Menu หรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    if (richMenu.lineRichMenuId) {
      try {
        await deleteRichMenu(
          decryptSecret(richMenu.lineAccount.accessToken),
          richMenu.lineRichMenuId,
        );
      } catch {
        // ถ้าลบบน LINE ไม่สำเร็จ ให้ลบในระบบต่อไป แต่ไม่ fail ทั้งคำขอ
      }
    }

    if (richMenu.imageUrl?.startsWith("/uploads/")) {
      const relative = richMenu.imageUrl.slice(1);
      const storageRoot = path.resolve(process.cwd(), "storage");
      const publicRoot = path.resolve(process.cwd(), "public");
      const storageFile = path.resolve(storageRoot, relative);
      const publicFile = path.resolve(publicRoot, relative);

      if (storageFile.startsWith(storageRoot + path.sep)) {
        unlink(storageFile).catch(() => {});
      }
      if (publicFile.startsWith(publicRoot + path.sep)) {
        unlink(publicFile).catch(() => {});
      }
    }

    await prisma.$transaction([
      prisma.richMenuArea.deleteMany({ where: { richMenuId: id } }),
      prisma.deployLog.deleteMany({ where: { richMenuId: id } }),
      prisma.clickEvent.deleteMany({ where: { richMenuId: id } }),
      prisma.richMenu.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "ลบ Rich Menu ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
