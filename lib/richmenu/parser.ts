import { richMenuJsonSchema, type RichMenuJson } from "./schema";

export function parseRichMenuJson(jsonString: string): RichMenuJson {
  let data: unknown;

  try {
    data = JSON.parse(jsonString) as unknown;
  } catch (e) {
    throw new Error("ไฟล์ JSON ไม่ถูกต้อง");
  }
  const parsed = richMenuJsonSchema.safeParse(data);

  if (!parsed.success) {
    const msg =
      parsed.error.flatten().formErrors.join(", ") ||
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ");

    throw new Error(`รูปแบบ Rich Menu ไม่ถูกต้อง: ${msg}`);
  }

  return parsed.data;
}

export function validateImageSize(
  width: number,
  height: number,
  expectedWidth: number,
  expectedHeight: number,
): void {
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(
      `ขนาดรูปไม่ตรงกับ Rich Menu: ได้ ${width}×${height}, ต้องการ ${expectedWidth}×${expectedHeight}`,
    );
  }
}
