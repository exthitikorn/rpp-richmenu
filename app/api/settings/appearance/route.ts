import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { updateAppearanceSettings } from "@/lib/site-settings";

const appearanceSchema = z.object({
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  backgroundColor: z.string().min(1),
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
  const parseResult = appearanceSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json(parseResult.error.format(), { status: 400 });
  }

  await updateAppearanceSettings(parseResult.data);

  return NextResponse.json({ success: true });
}
