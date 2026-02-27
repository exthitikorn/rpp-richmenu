import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  name: z.string().optional(),
  isApproved: z.boolean().optional(),
  password: z
    .string()
    .min(6, "รหัสผ่านอย่างน้อย 6 ตัว")
    .optional()
    .or(z.literal("")),
  organizationIds: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const isOwner = currentUser.memberships.some((m) => m.role === "OWNER");

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (currentUser.id === id) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถแก้ไขสิทธิ์ของบัญชีตัวเองได้",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้ใช้" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const { name, isApproved, password, organizationIds } = parsed.data;

    const data: Record<string, unknown> = {};

    if (typeof name !== "undefined") data.name = name;
    if (typeof isApproved !== "undefined") data.isApproved = isApproved;

    if (typeof password !== "undefined") {
      if (password.length === 0) {
        data.passwordHash = null;
      } else {
        data.passwordHash = await (
          await import("bcryptjs")
        ).default.hash(password, 10);
      }
    }

    if (typeof organizationIds !== "undefined") {
      await prisma.$transaction(async (tx) => {
        if (organizationIds.length === 0) {
          await tx.membership.deleteMany({
            where: { userId: id },
          });
        } else {
          await tx.membership.deleteMany({
            where: { userId: id, organizationId: { notIn: organizationIds } },
          });

          const existingMemberships = await tx.membership.findMany({
            where: { userId: id, organizationId: { in: organizationIds } },
            select: { organizationId: true },
          });

          const existingOrgIds = new Set(
            existingMemberships.map((m) => m.organizationId),
          );

          const newOrgIds = organizationIds.filter(
            (orgId) => !existingOrgIds.has(orgId),
          );

          if (newOrgIds.length > 0) {
            await tx.membership.createMany({
              data: newOrgIds.map((orgId) => ({
                userId: id,
                organizationId: orgId,
                role: "MEMBER",
              })),
            });
          }
        }

        if (Object.keys(data).length > 0) {
          await tx.user.update({
            where: { id },
            data,
          });
        }
      });
    } else if (Object.keys(data).length > 0) {
      await prisma.user.update({
        where: { id },
        data,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถอัปเดตผู้ใช้ได้" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const isOwner = currentUser.memberships.some((m) => m.role === "OWNER");

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (currentUser.id === id) {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถลบบัญชีตัวเองได้" },
        { status: 400 },
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถลบผู้ใช้ได้" },
      { status: 500 },
    );
  }
}
