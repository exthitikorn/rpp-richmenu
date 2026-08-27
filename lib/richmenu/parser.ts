import { richMenuJsonSchema, type RichMenuJson } from "./schema";

export function parseRichMenuJson(jsonString: string): RichMenuJson {
  let data: unknown;

  try {
    data = JSON.parse(jsonString) as unknown;
  } catch (e) {
    throw new Error("ไฟล์ JSON ไม่ถูกต้อง" + e);
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

/** LINE Messaging API rich menu image max file size */
export const LINE_RICH_MENU_IMAGE_MAX_BYTES = 1024 * 1024;

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

export function validateImageByteSize(byteLength: number): void {
  if (byteLength > LINE_RICH_MENU_IMAGE_MAX_BYTES) {
    const mb = (byteLength / (1024 * 1024)).toFixed(2);

    throw new Error(
      `ขนาดไฟล์รูปเกิน 1 MB (ได้ ${mb} MB) — LINE จำกัดไม่เกิน 1 MB กรุณาบีบอัดเป็น JPEG/PNG แล้วอัปโหลดใหม่`,
    );
  }
}
