import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/app/generated/prisma/client";
import { getDbPoolConfig } from "@/lib/db-config";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set in environment variables. กรุณาตั้งค่าในไฟล์ .env",
  );
}

const poolConfig = getDbPoolConfig(DATABASE_URL);
const adapter = new PrismaMariaDb(poolConfig);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
