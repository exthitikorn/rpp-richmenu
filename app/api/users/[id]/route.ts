import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  name: z.string().optional(),
  isApproved: z.boolean().optional(),
  organizationIds: z.array(z.string()).optional(),
  memberships: z
    .array(
      z.object({
        organizationId: z.string(),
        role: z.enum(["ADMIN", "USER"]),
      }),
    )
    .optional(),
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

    const isAdmin = currentUser.memberships.some((m) => m.role === "ADMIN");

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
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

    const { name, isApproved, organizationIds, memberships } = parsed.data;
    const isSelfUpdate = currentUser.id === id;
    const hasMembershipsUpdate = typeof memberships !== "undefined";
    const hasOrganizationIdsUpdate = typeof organizationIds !== "undefined";
    const hasNonMembershipUpdate =
      typeof name !== "undefined" || typeof isApproved !== "undefined";

    if (isSelfUpdate && hasNonMembershipUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถแก้ไขข้อมูลสำคัญของบัญชีตัวเองจากหน้านี้ได้",
        },
        { status: 400 },
      );
    }

    if (isSelfUpdate && hasOrganizationIdsUpdate && !hasMembershipsUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: "การแก้ไขบัญชีตัวเองต้องกำหนดสิทธิ์แบบละเอียด (memberships)",
        },
        { status: 400 },
      );
    }

    if (
      isSelfUpdate &&
      hasMembershipsUpdate &&
      (memberships ?? []).every((membership) => membership.role !== "ADMIN")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "บัญชีแอดมินของคุณต้องมีสิทธิ์ ADMIN อย่างน้อย 1 หน่วยงาน",
        },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};

    if (typeof name !== "undefined") data.name = name;
    if (typeof isApproved !== "undefined") data.isApproved = isApproved;

    if (typeof memberships !== "undefined") {
      await prisma.$transaction(async (tx) => {
        if (memberships.length === 0) {
          await tx.membership.deleteMany({
            where: { userId: id },
          });
        } else {
          const organizationIdsForMemberships = memberships.map(
            (membership) => membership.organizationId,
          );

          await tx.membership.deleteMany({
            where: {
              userId: id,
              organizationId: { notIn: organizationIdsForMemberships },
            },
          });

          for (const membership of memberships) {
            await tx.membership.upsert({
              where: {
                userId_organizationId: {
                  userId: id,
                  organizationId: membership.organizationId,
                },
              },
              create: {
                userId: id,
                organizationId: membership.organizationId,
                role: membership.role,
              },
              update: {
                role: membership.role,
              },
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
    } else if (typeof organizationIds !== "undefined") {
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
                role: "USER",
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

    const isAdmin = currentUser.memberships.some((m) => m.role === "ADMIN");

    if (!isAdmin) {
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
