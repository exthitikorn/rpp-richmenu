import type { NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

type LineProfile = {
  sub?: string;
  name?: string;
  picture?: string;
  email?: string;
};

type ProviderUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

async function upsertUserFromLineProfile(
  lineProfile: LineProfile | null | undefined,
  providerUser: ProviderUser | null | undefined,
) {
  const lineUserId = lineProfile?.sub;

  if (!lineUserId) {
    return null;
  }

  const displayName = lineProfile?.name ?? providerUser?.name ?? null;
  const picture = lineProfile?.picture ?? providerUser?.image ?? null;
  const emailFromLine = lineProfile?.email ?? providerUser?.email ?? null;

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
          lineDisplayName: displayName,
          linePictureUrl: picture,
        },
      });
    }
  }

  // 3) ถ้ายังไม่มีก็สร้าง user ใหม่ (ให้รอ admin อนุมัติก่อน)
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: emailFromLine ?? `${lineUserId}@line.local`, // fallback ให้ email เป็น unique
        name: displayName,
        image: picture,
        isApproved: false,
        lineUserId,
        lineDisplayName: displayName,
        linePictureUrl: picture,
      },
    });
  }

  return dbUser;
}

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
          isApproved: user.isApproved,
        };
      },
    }),
    LineProvider({
      clientId: process.env.LINE_LOGIN_CHANNEL_ID ?? "",
      clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "line") {
        const dbUser = await upsertUserFromLineProfile(
          profile as LineProfile | null | undefined,
          user as ProviderUser | null | undefined,
        );

        if (!dbUser) {
          return "/login?error=LineProfileMissing";
        }

        (user as ProviderUser).id = dbUser.id;
        (user as ProviderUser & { isApproved?: boolean }).isApproved =
          dbUser.isApproved;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.isApproved = (user as { isApproved?: boolean }).isApproved;
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) return session;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.email = dbUser.email ?? session.user.email ?? null;
        session.user.name =
          dbUser.name ?? dbUser.lineDisplayName ?? session.user.name ?? null;
        session.user.image =
          dbUser.image ?? dbUser.linePictureUrl ?? session.user.image ?? null;
        session.user.isApproved = dbUser.isApproved;
      } else {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
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
      isApproved?: boolean;
    };
  }
}
