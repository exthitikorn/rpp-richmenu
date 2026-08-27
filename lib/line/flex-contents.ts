import { z } from "zod";

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), {
    message: "URL ต้องขึ้นต้นด้วย https://",
  });

const textSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  wrap: z.boolean().optional(),
  weight: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
});

const imageSchema = z.object({
  type: z.literal("image"),
  url: httpsUrl,
  size: z.string().optional(),
  aspectRatio: z.string().optional(),
  aspectMode: z.enum(["cover", "fit"]).optional(),
});

const buttonSchema = z.object({
  type: z.literal("button"),
  action: z.object({
    type: z.literal("uri"),
    label: z.string().trim().min(1),
    uri: httpsUrl,
  }),
});

const separatorSchema = z.object({
  type: z.literal("separator"),
  margin: z.string().optional(),
  color: z.string().optional(),
});

let boxSchema: z.ZodTypeAny;

const flexNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.discriminatedUnion("type", [
    boxSchema,
    textSchema,
    imageSchema,
    buttonSchema,
    separatorSchema,
  ]),
);

boxSchema = z.object({
  type: z.literal("box"),
  layout: z.enum(["vertical", "horizontal"]),
  contents: z.array(flexNodeSchema),
  spacing: z.string().optional(),
  margin: z.string().optional(),
});

const bubbleSchema = z.object({
  type: z.literal("bubble"),
  body: boxSchema,
  hero: imageSchema.optional(),
  footer: boxSchema.optional(),
});

const carouselSchema = z.object({
  type: z.literal("carousel"),
  contents: z.array(bubbleSchema).min(2).max(10),
});

export const flexContentsSchema = z.union([bubbleSchema, carouselSchema]);

export type FlexContents = z.infer<typeof flexContentsSchema>;

export function emptyBubble(): FlexContents {
  return {
    type: "bubble",
    body: { type: "box", layout: "vertical", contents: [] },
  };
}

export function emptyCarousel(): FlexContents {
  return {
    type: "carousel",
    contents: [emptyBubble(), emptyBubble()],
  };
}

export function parseFlexContents(input: unknown): FlexContents {
  return flexContentsSchema.parse(input);
}
