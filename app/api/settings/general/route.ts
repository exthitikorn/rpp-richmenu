import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings, updateGeneralSettings } from "@/lib/site-settings";

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
] as const;

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function isAllowedImageType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(
    type as (typeof ALLOWED_IMAGE_TYPES)[number],
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const siteName = (formData.get("siteName") as string | null)?.trim() ?? "";
  const siteDescription =
    (formData.get("siteDescription") as string | null)?.trim() ?? "";

  if (!siteName) {
    return NextResponse.json(
      { success: false, error: "Site name is required" },
      { status: 400 },
    );
  }

  const current = await getSiteSettings();

  let logoUrl: string | null | undefined;
  const logoFile = formData.get("logo") as File | null;

  if (logoFile && logoFile.size > 0) {
    if (!isAllowedImageType(logoFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Logo ต้องเป็นไฟล์ PNG, JPG หรือ SVG",
        },
        { status: 400 },
      );
    }

    if (logoFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "ขนาดไฟล์ Logo ต้องไม่เกิน 2MB",
        },
        { status: 400 },
      );
    }

    const logoBuffer = await logoFile.arrayBuffer();
    const extension =
      logoFile.type === "image/png"
        ? "png"
        : logoFile.type === "image/svg+xml"
          ? "svg"
          : "jpg";

    const blob = await put(`site/logo-${Date.now()}.${extension}`, logoBuffer, {
      access: "public",
      contentType: logoFile.type,
    });

    logoUrl = blob.url;
  } else {
    logoUrl = current.logoUrl;
  }

  let faviconUrl: string | null | undefined;
  const faviconFile = formData.get("favicon") as File | null;

  if (faviconFile && faviconFile.size > 0) {
    if (!isAllowedImageType(faviconFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Favicon ต้องเป็นไฟล์ PNG, JPG หรือ SVG",
        },
        { status: 400 },
      );
    }

    if (faviconFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "ขนาดไฟล์ Favicon ต้องไม่เกิน 2MB",
        },
        { status: 400 },
      );
    }

    const faviconBuffer = await faviconFile.arrayBuffer();
    const extension =
      faviconFile.type === "image/png"
        ? "png"
        : faviconFile.type === "image/svg+xml"
          ? "svg"
          : "jpg";

    const blob = await put(
      `site/favicon-${Date.now()}.${extension}`,
      faviconBuffer,
      {
        access: "public",
        contentType: faviconFile.type,
      },
    );

    faviconUrl = blob.url;
  } else {
    faviconUrl = current.faviconUrl;
  }

  await updateGeneralSettings({
    siteName,
    siteDescription,
    logoUrl,
    faviconUrl,
  });

  return NextResponse.json({ success: true });
}
