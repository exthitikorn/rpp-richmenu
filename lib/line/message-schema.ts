import { z } from "zod";

export const autoResponseSettingsSchema = z.object({
  autoResponseEnabled: z.boolean(),
  fallbackMessage: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), {
    message: "URL ต้องขึ้นต้นด้วย https://",
  });

export const flexCardSchema = z.object({
  imageUrl: httpsUrl.optional().or(z.literal("").transform(() => undefined)),
  title: z.string().trim().optional(),
  body: z.string().trim().min(1, "กรุณาระบุเนื้อหา"),
  actionLabel: z.string().trim().optional(),
  actionUri: httpsUrl.optional(),
});

export const flexSingleFormSchema = z.object({
  pattern: z.literal("single"),
  altText: z.string().trim().min(1, "กรุณาระบุข้อความสำรอง"),
  card: flexCardSchema,
});

export const flexCarouselFormSchema = z.object({
  pattern: z.literal("carousel"),
  altText: z.string().trim().min(1, "กรุณาระบุข้อความสำรอง"),
  cards: z.array(flexCardSchema).min(2, "อย่างน้อย 2 การ์ด").max(3),
});

export const flexJsonFormSchema = z.object({
  pattern: z.literal("json"),
  altText: z.string().trim().min(1, "กรุณาระบุข้อความสำรอง"),
  contentsJson: z.string().trim().min(2, "กรุณาวาง Flex JSON"),
});

export const flexFormSchema = z.discriminatedUnion("pattern", [
  flexSingleFormSchema,
  flexCarouselFormSchema,
  flexJsonFormSchema,
]);

export const createKeywordRuleSchema = z
  .object({
    keyword: z.string().trim().min(1, "กรุณาระบุ keyword"),
    isEnabled: z.boolean().default(true),
    responseType: z.enum(["TEXT", "FLEX"]),
    text: z.string().trim().optional(),
    flex: flexFormSchema.optional(),
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
  altText: z.string().trim().min(1),
  contents: z.record(z.string(), z.unknown()),
});

export type FlexCardInput = z.infer<typeof flexCardSchema>;
export type FlexFormInput = z.infer<typeof flexFormSchema>;
