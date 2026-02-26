import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;

    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
  }

  return parsed.data;
}

export const env = validateEnv();
