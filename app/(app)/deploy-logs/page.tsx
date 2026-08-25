import { DeployLogsTable, type DeployLogRow } from "./DeployLogsTable";

import { deployLogWhere } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/layouts/PageShell";
import { DataTableCard } from "@/components/data/DataTableCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { siteConfig } from "@/config/site";

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

  const where = deployLogWhere(user);

  const [totalCount, logs] = await Promise.all([
    prisma.deployLog.count({ where }),
    prisma.deployLog.findMany({
      where,
      include: {
        richMenu: {
          include: {
            lineAccount: true,
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

  const rows: DeployLogRow[] = logs.map((log) => ({
    id: log.id,
    status: log.status,
    message: log.message,
    deployedAt: log.deployedAt.toISOString(),
    richMenuName: log.richMenu.name,
    lineAccountName: log.richMenu.lineAccount.name,
  }));

  return (
    <PageShell>
      <PageHeader
        description="ประวัติการ Deploy Rich Menu"
        title={siteConfig.labels.deployLogs}
      />
      <DataTableCard
        description="รายการ Deploy ล่าสุด"
        emptyState={<EmptyState title="ยังไม่มีบันทึกการ Deploy" />}
        isEmpty={rows.length === 0}
        title="ประวัติการ Deploy"
      >
        <DeployLogsTable
          currentPage={currentPage}
          from={from}
          logs={rows}
          to={to}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </DataTableCard>
    </PageShell>
  );
}
