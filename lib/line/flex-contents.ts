import { z } from "zod";

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), {
    message: "URL ต้องขึ้นต้นด้วย https://",
  });

const textSchema = z.strictObject({
  type: z.literal("text"),
  text: z.string(),
  wrap: z.boolean().optional(),
  weight: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
});

const imageSchema = z.strictObject({
  type: z.literal("image"),
  url: httpsUrl,
  size: z.string().optional(),
  aspectRatio: z.string().optional(),
  aspectMode: z.enum(["cover", "fit"]).optional(),
});

const buttonSchema = z.strictObject({
  type: z.literal("button"),
  action: z.strictObject({
    type: z.literal("uri"),
    label: z.string().trim().min(1),
    uri: httpsUrl,
  }),
});

const separatorSchema = z.strictObject({
  type: z.literal("separator"),
  margin: z.string().optional(),
  color: z.string().optional(),
});

let boxSchema: z.ZodTypeAny;

// z.union: ZodTypeAny (lazy box) is not $ZodTypeDiscriminable, so
// discriminatedUnion cannot type-check the circular box/node schemas.
const flexNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([boxSchema, textSchema, imageSchema, buttonSchema, separatorSchema]),
);

boxSchema = z.strictObject({
  type: z.literal("box"),
  layout: z.enum(["vertical", "horizontal"]),
  contents: z
    .array(flexNodeSchema)
    .min(1, "กล่องต้องมีองค์ประกอบอย่างน้อย 1 รายการ"),
  spacing: z.string().optional(),
  margin: z.string().optional(),
});

const bubbleSchema = z.strictObject({
  type: z.literal("bubble"),
  body: boxSchema,
  hero: imageSchema.optional(),
  footer: boxSchema.optional(),
});

const carouselSchema = z.strictObject({
  type: z.literal("carousel"),
  contents: z.array(bubbleSchema).min(2).max(10),
});

export const flexContentsSchema = z.union([bubbleSchema, carouselSchema]);

export type FlexContents = z.infer<typeof flexContentsSchema>;
export type FlexBubble = z.infer<typeof bubbleSchema>;
export type FlexCarousel = z.infer<typeof carouselSchema>;

export function emptyBubble(): FlexBubble {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "ข้อความ", wrap: true }],
    },
  };
}

export function emptyCarousel(): FlexCarousel {
  return {
    type: "carousel",
    contents: [emptyBubble(), emptyBubble()],
  };
}

export function parseFlexContents(input: unknown): FlexContents {
  return flexContentsSchema.parse(input);
}
