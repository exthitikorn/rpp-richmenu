"use client";

import type { LineAccountRequestPublic } from "@/lib/line-account-request-types";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { LineAccountRequestStatusChip } from "@/components/line-account/LineAccountRequestStatusChip";
import { useAppToast } from "@/components/AppToastProvider";

function formatRequesterDate(date: Date) {
  return date.toLocaleDateString("th-TH");
}

function CancelRequestButton({ requestId }: { requestId: string }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/line-account-requests/${requestId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        const message = data.error ?? "ยกเลิกไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setLoading(false);

        return;
      }
      onOpenChange();
      toast.success("ยกเลิกคำขอแล้ว");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      toast.error("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <>
      <Button color="danger" size="sm" variant="light" onPress={onOpen}>
        ยกเลิก
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>ยกเลิกคำขอ</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p>ต้องการยกเลิกคำขอนี้ใช่หรือไม่? สามารถส่งคำขอใหม่ได้ภายหลัง</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => onOpenChange()}>
              ไม่ยกเลิก
            </Button>
            <Button color="danger" isLoading={loading} onPress={handleCancel}>
              ยกเลิกคำขอ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function RequestRowActions({ request }: { request: LineAccountRequestPublic }) {
  if (request.status === "PENDING") {
    return <CancelRequestButton requestId={request.id} />;
  }

  if (request.status === "APPROVED" && request.lineAccountId) {
    return (
      <Button
        as={NextLink}
        href={`/line-accounts/${request.lineAccountId}`}
        size="sm"
        variant="flat"
      >
        ดูบัญชี
      </Button>
    );
  }

  return null;
}

function RequestCard({ request }: { request: LineAccountRequestPublic }) {
  return (
    <Card className="border border-default-200 shadow-none">
      <CardBody className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-foreground">{request.name}</p>
          <LineAccountRequestStatusChip status={request.status} />
        </div>
        <p className="font-mono text-xs text-default-500">
          {request.channelId}
        </p>
        <p className="text-xs text-default-500">
          ส่งเมื่อ {formatRequesterDate(request.createdAt)}
        </p>
        {request.status === "REJECTED" && request.rejectionReason ? (
          <p className="text-danger text-sm">
            เหตุผล: {request.rejectionReason}
          </p>
        ) : null}
        <div className="pt-1">
          <RequestRowActions request={request} />
        </div>
      </CardBody>
    </Card>
  );
}

export function MyLineAccountRequests({
  requests,
}: {
  requests: LineAccountRequestPublic[];
}) {
  if (requests.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
        คำขอของฉัน
      </h2>

      <div className="hidden md:block">
        <Table
          aria-label="คำขอ LINE Account ของฉัน"
          classNames={{ wrapper: "border border-default-200 shadow-none" }}
        >
          <TableHeader>
            <TableColumn>ชื่อ</TableColumn>
            <TableColumn>Channel ID</TableColumn>
            <TableColumn>สถานะ</TableColumn>
            <TableColumn>วันที่ส่ง</TableColumn>
            <TableColumn>การทำงาน</TableColumn>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div>
                    <p>{request.name}</p>
                    {request.status === "REJECTED" &&
                    request.rejectionReason ? (
                      <p className="text-danger mt-1 text-xs">
                        เหตุผล: {request.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{request.channelId}</span>
                </TableCell>
                <TableCell>
                  <LineAccountRequestStatusChip status={request.status} />
                </TableCell>
                <TableCell>{formatRequesterDate(request.createdAt)}</TableCell>
                <TableCell>
                  <RequestRowActions request={request} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </section>
  );
}
