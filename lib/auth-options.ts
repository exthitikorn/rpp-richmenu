import type { NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.passwordHash) return null;
        if (!user.isApproved) return null;
        const ok = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
    LineProvider({
      clientId: process.env.LINE_LOGIN_CHANNEL_ID ?? "",
      clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Login ด้วย LINE
      if (account?.provider === "line") {
        const lineProfile = profile as
          | {
              sub?: string;
              name?: string;
              picture?: string;
              email?: string;
            }
          | null
          | undefined;

        const lineUserId = lineProfile?.sub;

        if (!lineUserId) {
          return token;
        }

        const displayName = lineProfile?.name ?? user?.name ?? undefined;
        const picture = lineProfile?.picture ?? user?.image ?? undefined;
        const emailFromLine = lineProfile?.email ?? user?.email ?? undefined;

        // 1) หา user จาก lineUserId ก่อน
        let dbUser =
          (await prisma.user.findUnique({
            where: { lineUserId },
          })) ?? null;

        // 2) ถ้ายังไม่เจอและมีอีเมล ให้ลอง match ตามอีเมล (ผูก LINE เข้ากับ user เดิม)
        if (!dbUser && emailFromLine) {
          const byEmail = await prisma.user.findUnique({
            where: { email: emailFromLine },
          });

          if (byEmail) {
            dbUser = await prisma.user.update({
              where: { id: byEmail.id },
              data: {
                lineUserId,
                lineDisplayName: displayName ?? null,
                linePictureUrl: picture ?? null,
              },
            });
          }
        }

        // 3) ถ้ายังไม่มีก็สร้าง user ใหม่ (อนุมัติให้ใช้งานได้เลย)
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: emailFromLine ?? `${lineUserId}@line.local`, // fallback ให้ email เป็น unique
              name: displayName ?? null,
              image: picture ?? null,
              isApproved: true,
              lineUserId,
              lineDisplayName: displayName ?? null,
              linePictureUrl: picture ?? null,
            },
          });
        }

        token.id = dbUser.id;

        return token;
      }

      // Login แบบอีเมล/รหัสผ่าน
      if (user) token.id = (user as { id: string }).id;

      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret:
    process.env.NEXTAUTH_SECRET ?? "development-secret-change-in-production",
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
