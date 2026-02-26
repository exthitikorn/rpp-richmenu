import { prisma } from "@/lib/prisma";

export { prisma };

export async function getPrisma() {
  return prisma;
}
