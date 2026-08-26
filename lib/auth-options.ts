import type { NextAuthOptions } from "next-auth";
import type { LDAPErrorCode } from "@/types/ldap";

import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { LDAPProvider } from "@/lib/auth/providers/ldap.provider";
import {
  isLineLoginConfigured,
  LineProvider,
} from "@/lib/auth/providers/line.provider";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "ldap",
    name: "บัญชีโรงพยาบาล",
    credentials: {
      username: { label: "ชื่อผู้ใช้", type: "text" },
      password: { label: "รหัสผ่าน", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.username || !credentials?.password) {
        throw new Error("กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน");
      }

      const ldapProvider = new LDAPProvider();

      try {
        const ldapUser = await ldapProvider.authenticate(
          credentials.username,
          credentials.password,
        );

        if (!ldapUser) {
          throw new Error("การเข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง");
        }

        const user = await prisma.user.upsert({
          where: { ldapUsername: ldapUser.ldapUsername },
          create: {
            ldapUsername: ldapUser.ldapUsername,
            name: ldapUser.displayName,
            email: ldapUser.email,
            department: ldapUser.department,
            isApproved: false,
          },
          update: {
            name: ldapUser.displayName,
            email: ldapUser.email,
            department: ldapUser.department,
          },
        });

        return {
          id: user.id,
          name: user.name ?? ldapUser.displayName,
          email: user.email ?? undefined,
          isApproved: user.isApproved,
        };
      } catch (error) {
        if (error instanceof Error) {
          const message = ldapProvider.mapErrorCodeToMessage(
            error.message as LDAPErrorCode,
          );

          throw new Error(message);
        }
        throw new Error("เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง");
      }
    },
  }),
];

if (isLineLoginConfigured()) {
  providers.push(LineProvider());
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "line") {
        return true;
      }

      const dbUser = await prisma.user.findFirst({
        where: { lineUserId: user.id },
      });

      if (!dbUser) {
        return "/login?error=LineNotLinked";
      }

      return true;
    },
    async jwt({ token, user, account }) {
      const userIdFromToken = token.id as string | undefined;
      let userIdFromUser = (user as { id?: string } | undefined)?.id;

      if (account?.provider === "line" && userIdFromUser) {
        const dbUser = await prisma.user.findFirst({
          where: { lineUserId: userIdFromUser },
        });

        if (dbUser) {
          userIdFromUser = dbUser.id;
          token.id = dbUser.id;
          token.isApproved = dbUser.isApproved;
        }
      }

      const userId = userIdFromUser ?? userIdFromToken;

      if (user && account?.provider !== "line") {
        token.id = (user as { id: string }).id;
        token.isApproved = (user as { isApproved?: boolean }).isApproved;
      }

      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { isSystemAdmin: true, isApproved: true },
        });

        if (dbUser) {
          token.isSystemAdmin = dbUser.isSystemAdmin;
          token.isApproved = dbUser.isApproved;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) return session;

      const userId = token.id as string | undefined;

      if (!userId) {
        return session;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.email = dbUser.email ?? session.user.email ?? null;
        session.user.name = dbUser.name ?? session.user.name ?? null;
        session.user.image = dbUser.image ?? dbUser.linePictureUrl ?? null;
        session.user.isApproved = dbUser.isApproved;
        session.user.isSystemAdmin = dbUser.isSystemAdmin;
        session.user.ldapUsername = dbUser.ldapUsername;
        session.user.department = dbUser.department;
      } else {
        session.user.id = userId;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is required");
    }

    return secret;
  })(),
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      ldapUsername?: string | null;
      department?: string | null;
      isApproved?: boolean;
      isSystemAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isApproved?: boolean;
    isSystemAdmin?: boolean;
  }
}
