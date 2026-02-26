import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null;
  prismaPromise: Promise<PrismaClient> | null;
};

async function createPrisma(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL;

  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaMariaDb(url);

  return new PrismaClient({ adapter });
}

export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = createPrisma();
  }
  const client = await globalForPrisma.prismaPromise;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}
