import NextLink from "next/link";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";

const PAGE_SIZE = 10;

export default async function DeployLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) return null;

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(String(pageParam), 10) || 1);

  const where = {
    richMenu: {
      lineAccount: {
        organization: { memberships: { some: { userId: user.id } } },
      },
    },
  } as const;

  const [totalCount, logs] = await Promise.all([
    prisma.deployLog.count({ where }),
    prisma.deployLog.findMany({
      where,
      include: {
        richMenu: {
          include: {
            lineAccount: { include: { organization: true } },
          },
        },
      },
      orderBy: { deployedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <PageHeader
        description="ประวัติการ Deploy Rich Menu"
        title="Deploy Logs"
      />
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader className="px-4 py-3 text-sm font-medium">
          ประวัติการ Deploy
        </CardHeader>
        <CardBody className="min-w-0 overflow-x-auto px-4 py-3">
          {logs.length === 0 ? (
            <p className="py-4 text-sm text-default-500">ยังไม่มี log</p>
          ) : (
            <>
              {/* หัวคอลัมน์ (แสดงบนจอใหญ่) */}
              <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,2fr)] gap-x-4 border-b border-default-200 pb-2 text-xs font-medium text-default-500 md:grid">
                <span>Rich Menu</span>
                <span>บัญชี · สถานะ · วันที่</span>
                <span>หมายเหตุ</span>
              </div>
              <ul className="divide-y divide-default-200">
                {logs.map((log) => (
                  <li
                    key={log.id}
                    className="grid grid-cols-1 gap-x-4 gap-y-0.5 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,2fr)] md:items-center"
                  >
                    <p className="text-sm font-medium leading-tight">
                      {log.richMenu.name}
                    </p>
                    <p
                      className="text-xs text-default-500 md:truncate"
                      title={`${log.richMenu.lineAccount.name} · ${log.status} · ${new Date(log.deployedAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}`}
                    >
                      {log.richMenu.lineAccount.name} · {log.status} ·{" "}
                      {new Date(log.deployedAt).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    {log.message ? (
                      <p className="line-clamp-2 text-xs text-default-400 md:min-w-0">
                        {log.message}
                      </p>
                    ) : (
                      <span className="text-xs text-default-300">—</span>
                    )}
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  aria-label="การแบ่งหน้า"
                  className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-default-200 pt-3"
                >
                  <p className="text-xs text-default-500">
                    แสดง {from}–{to} จาก {totalCount} รายการ
                  </p>
                  <div className="flex items-center gap-2">
                    {currentPage <= 1 ? (
                      <Button
                        isDisabled
                        aria-label="หน้าก่อนหน้า"
                        size="sm"
                        variant="flat"
                      >
                        ก่อนหน้า
                      </Button>
                    ) : (
                      <Button
                        aria-label="หน้าก่อนหน้า"
                        as={NextLink}
                        href={`/deploy-logs?page=${currentPage - 1}`}
                        size="sm"
                        variant="flat"
                      >
                        ก่อนหน้า
                      </Button>
                    )}
                    <span className="px-1.5 text-xs text-default-500">
                      หน้า {currentPage} / {totalPages}
                    </span>
                    {currentPage >= totalPages ? (
                      <Button
                        isDisabled
                        aria-label="หน้าถัดไป"
                        size="sm"
                        variant="flat"
                      >
                        ถัดไป
                      </Button>
                    ) : (
                      <Button
                        aria-label="หน้าถัดไป"
                        as={NextLink}
                        href={`/deploy-logs?page=${currentPage + 1}`}
                        size="sm"
                        variant="flat"
                      >
                        ถัดไป
                      </Button>
                    )}
                  </div>
                </nav>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
