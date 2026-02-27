import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sizeOf from "image-size";

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
      where: {
        id: richMenuId,
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
      include: {
        lineAccount: true,
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

    const blob = await put(
      `richmenus/${richMenu.lineAccountId}/${Date.now()}.${contentType === "image/png" ? "png" : "jpg"}`,
      imageBuffer,
      {
        access: "public",
        contentType,
      },
    );

    const updated = await prisma.richMenu.update({
      where: { id: richMenu.id },
      data: {
        imageUrl: blob.url,
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
