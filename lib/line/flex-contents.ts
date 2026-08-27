import { z } from "zod";

/** Loose Flex contents — accepts LINE Flex Message Simulator JSON. */
export const flexContentsSchema = z
  .object({
    type: z.enum(["bubble", "carousel"], {
      message: "root ต้องเป็น bubble หรือ carousel",
    }),
  })
  .passthrough()
  .superRefine((val, ctx) => {
    if (val.type !== "carousel") return;

    const contents = (val as { contents?: unknown }).contents;

    if (!Array.isArray(contents)) {
      ctx.addIssue({
        code: "custom",
        message: "carousel ต้องมี contents เป็น array",
        path: ["contents"],
      });

      return;
    }

    if (contents.length < 2 || contents.length > 12) {
      ctx.addIssue({
        code: "custom",
        message: "carousel ต้องมี 2–12 บับเบิล",
        path: ["contents"],
      });
    }
  });

export type FlexContents = z.infer<typeof flexContentsSchema>;

/**
 * Accept either raw bubble/carousel, or a full Flex Message
 * `{ type: "flex", altText?, contents }` from the Simulator export.
 */
export function unwrapFlexJson(input: unknown): {
  contents: unknown;
  altText?: string;
} {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { contents: input };
  }

  const rec = input as Record<string, unknown>;

  if (
    rec.type === "flex" &&
    rec.contents !== null &&
    typeof rec.contents === "object"
  ) {
    return {
      contents: rec.contents,
      altText: typeof rec.altText === "string" ? rec.altText : undefined,
    };
  }

  return { contents: input };
}

export function emptyBubble(): FlexContents {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "ข้อความ", wrap: true }],
    },
  };
}

export function parseFlexContents(input: unknown): FlexContents {
  return flexContentsSchema.parse(input);
}
