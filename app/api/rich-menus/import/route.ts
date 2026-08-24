import { writeFile, mkdir } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import sizeOf from "image-size";

import { lineAccountByIdWhere } from "@/lib/access";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRichMenuJson, validateImageSize } from "@/lib/richmenu/parser";
import { RichMenuStatus } from "@/app/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const lineAccountId = formData.get("lineAccountId") as string | null;
    const jsonFile = formData.get("json") as File | null;
    const imageFile = formData.get("image") as File | null;

    if (!lineAccountId || !jsonFile || !imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาส่ง lineAccountId, ไฟล์ JSON และรูปภาพ",
        },
        { status: 400 },
      );
    }

    const lineAccount = await prisma.lineAccount.findFirst({
      where: lineAccountByIdWhere(user, lineAccountId),
    });

    if (!lineAccount) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ LINE Account" },
        { status: 404 },
      );
    }
    await requireRole(lineAccount.organizationId, ["ADMIN"]);

    const jsonText = await jsonFile.text();
    const parsed = parseRichMenuJson(jsonText);
    const {
      size,
      name: menuName,
      chatBarText: menuChatBarText,
      areas,
    } = parsed;

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
      size.width,
      size.height,
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
      lineAccountId,
    );

    await mkdir(uploadDir, { recursive: true });
    await writeFile(
      path.join(uploadDir, filename),
      new Uint8Array(imageBuffer),
    );

    const imageUrl = `/uploads/richmenus/${lineAccountId}/${filename}`;

    const richMenu = await prisma.richMenu.create({
      data: {
        lineAccountId,
        name: menuName ?? "Imported",
        chatBarText: menuChatBarText ?? "",
        width: size.width,
        height: size.height,
        imageUrl,
        status: RichMenuStatus.DRAFT,
        areas: {
          create: areas.map((a, i) => ({
            x: a.bounds.x,
            y: a.bounds.y,
            width: a.bounds.width,
            height: a.bounds.height,
            order: i,
            actionType: a.action.type,
            action: a.action as object,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, richMenuId: richMenu.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import ไม่สำเร็จ";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
