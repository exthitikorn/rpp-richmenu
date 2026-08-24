"use client";

import NextLink from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Button } from "@heroui/button";

export type DeployLogRow = {
  id: string;
  status: string;
  message: string | null;
  deployedAt: string;
  richMenuName: string;
  lineAccountName: string;
};

interface DeployLogsTableProps {
  logs: DeployLogRow[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  from: number;
  to: number;
}

export function DeployLogsTable({
  logs,
  currentPage,
  totalPages,
  totalCount,
  from,
  to,
}: DeployLogsTableProps) {
  return (
    <>
      <Table
        removeWrapper
        aria-label="ตารางบันทึกการ Deploy"
        classNames={{ wrapper: "shadow-none p-0" }}
      >
        <TableHeader>
          <TableColumn>Rich Menu</TableColumn>
          <TableColumn>บัญชี LINE</TableColumn>
          <TableColumn>สถานะ</TableColumn>
          <TableColumn>วันที่</TableColumn>
          <TableColumn>หมายเหตุ</TableColumn>
        </TableHeader>
        <TableBody items={logs}>
          {(log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.richMenuName}</TableCell>
              <TableCell>{log.lineAccountName}</TableCell>
              <TableCell>{log.status}</TableCell>
              <TableCell className="text-default-500">
                {new Date(log.deployedAt).toLocaleString("th-TH", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </TableCell>
              <TableCell className="max-w-xs truncate text-default-400">
                {log.message ?? "—"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
  );
}
