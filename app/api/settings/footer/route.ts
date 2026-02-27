import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { updateFooterSettings } from "@/lib/site-settings";

const socialLinkSchema = z.object({
  label: z.string().min(1),
  platform: z.string().min(1),
  url: z.string().url(),
});

const footerSchema = z.object({
  footerText: z.string().optional(),
  copyrightText: z.string().optional(),
  socialLinks: z.array(socialLinkSchema),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const json = await request.json();
  const parseResult = footerSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json(parseResult.error.format(), { status: 400 });
  }

  await updateFooterSettings(parseResult.data);

  return NextResponse.json({ success: true });
}
