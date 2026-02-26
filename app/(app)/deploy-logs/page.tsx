import { Card, CardBody, CardHeader } from "@heroui/card";

import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function DeployLogsPage() {
  const user = await getCurrentUser();

  if (!user) return null;
  const prisma = await getPrisma();
  const logs = await prisma.deployLog.findMany({
    where: {
      richMenu: {
        lineAccount: {
          organization: { memberships: { some: { userId: user.id } } },
        },
      },
    },
    include: {
      richMenu: {
        include: {
          lineAccount: { include: { organization: true } },
        },
      },
    },
    orderBy: { deployedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Deploy Logs</h1>
      <Card>
        <CardHeader>ประวัติการ Deploy</CardHeader>
        <CardBody>
          {logs.length === 0 ? (
            <p className="text-default-500">ยังไม่มี log</p>
          ) : (
            <ul className="divide-y divide-default-200">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="py-3 flex justify-between items-start gap-4"
                >
                  <div>
                    <p className="font-medium">{log.richMenu.name}</p>
                    <p className="text-sm text-default-500">
                      {log.richMenu.lineAccount.name} · {log.status} ·{" "}
                      {new Date(log.deployedAt).toLocaleString("th-TH")}
                    </p>
                    {log.message && (
                      <p className="text-sm text-default-400 mt-1">
                        {log.message}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
