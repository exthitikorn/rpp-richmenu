import { z } from "zod";

const boundsSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const uriActionSchema = z.object({
  type: z.literal("uri"),
  uri: z.string().url(),
  label: z.string().optional(),
});

const messageActionSchema = z.object({
  type: z.literal("message"),
  text: z.string(),
  label: z.string().optional(),
});

const postbackActionSchema = z.object({
  type: z.literal("postback"),
  data: z.string(),
  displayText: z.string().optional(),
  label: z.string().optional(),
});

const richMenuSwitchActionSchema = z.object({
  type: z.literal("richmenuswitch"),
  richMenuAliasId: z.string(),
  data: z.string(),
  label: z.string().optional(),
});

const actionSchema = z.discriminatedUnion("type", [
  uriActionSchema,
  messageActionSchema,
  postbackActionSchema,
  richMenuSwitchActionSchema,
]);

const areaSchema = z.object({
  bounds: boundsSchema,
  action: actionSchema,
});

export const richMenuJsonSchema = z.object({
  size: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  selected: z.boolean().optional(),
  name: z.string().optional(),
  chatBarText: z.string().optional(),
  areas: z.array(areaSchema).min(1).max(20),
});

export type RichMenuJson = z.infer<typeof richMenuJsonSchema>;
