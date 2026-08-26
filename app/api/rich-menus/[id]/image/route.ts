import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import sizeOf from "image-size";

import { richMenuByIdWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateImageSize } from "@/lib/richmenu/parser";
import { RichMenuStatus } from "@/app/generated/prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: richMenuId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกรูปภาพ" },
        { status: 400 },
      );
    }

    const richMenu = await prisma.richMenu.findFirst({
      where: richMenuByIdWhere(user, richMenuId),
      select: {
        id: true,
        width: true,
        height: true,
        imageUrl: true,
        lineAccountId: true,
      },
    });

    if (!richMenu) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Rich Menu" },
        { status: 404 },
      );
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const dimensions = sizeOf(new Uint8Array(imageBuffer));

    if (!dimensions.width || !dimensions.height) {
      return NextResponse.json(
        { success: false, error: "อ่านขนาดรูปภาพไม่ได้" },
        { status: 400 },
      );
    }

    validateImageSize(
      dimensions.width,
      dimensions.height,
      richMenu.width,
      richMenu.height,
    );

    const contentType = imageFile.type as "image/jpeg" | "image/png";

    if (contentType !== "image/jpeg" && contentType !== "image/png") {
      return NextResponse.json(
        { success: false, error: "รูปต้องเป็น JPEG หรือ PNG" },
        { status: 400 },
      );
    }

    const ext = contentType === "image/png" ? "png" : "jpg";
    const filename = `${Date.now()}.${ext}`;
    const uploadDir = path.join(
      process.cwd(),
      "storage",
      "uploads",
      "richmenus",
      richMenu.lineAccountId,
    );

    await mkdir(uploadDir, { recursive: true });
    await writeFile(
      path.join(uploadDir, filename),
      new Uint8Array(imageBuffer),
    );

    // ลบรูปเก่าถ้าเป็น local file
    if (richMenu.imageUrl?.startsWith("/uploads/")) {
      const oldPath = path.join(process.cwd(), "storage", richMenu.imageUrl);

      unlink(oldPath).catch(() => {});
    }

    const imageUrl = `/uploads/richmenus/${richMenu.lineAccountId}/${filename}`;

    const updated = await prisma.richMenu.update({
      where: { id: richMenu.id },
      data: {
        imageUrl,
        status: RichMenuStatus.DRAFT,
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl: updated.imageUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
