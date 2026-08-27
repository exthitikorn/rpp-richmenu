import { z } from "zod";

import { flexContentsSchema } from "./flex-contents";

export const autoResponseSettingsSchema = z.object({
  autoResponseEnabled: z.boolean(),
  fallbackMessage: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export const flexBuilderSchema = z.object({
  altText: z
    .string()
    .trim()
    .min(1, "กรุณาระบุข้อความสำรอง")
    .max(1500, "ข้อความสำรองยาวได้ไม่เกิน 1500 ตัวอักษร"),
  contents: flexContentsSchema,
});

export const createKeywordRuleSchema = z
  .object({
    keyword: z.string().trim().min(1, "กรุณาระบุ keyword"),
    isEnabled: z.boolean().default(true),
    responseType: z.enum(["TEXT", "FLEX"]),
    text: z.string().trim().optional(),
    flex: flexBuilderSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.responseType === "TEXT") {
      if (!val.text?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "กรุณาระบุข้อความตอบกลับ",
          path: ["text"],
        });
      }
    } else if (!val.flex) {
      ctx.addIssue({
        code: "custom",
        message: "กรุณากำหนด Flex Message",
        path: ["flex"],
      });
    }
  });

export const storedTextPayloadSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

export const storedFlexPayloadSchema = z.object({
  altText: z.string().trim().min(1).max(1500),
  contents: z.record(z.string(), z.unknown()),
});
