"use client";

import type { PendingLineAccountRequestPublic } from "@/lib/line-account-request-types";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";

import { useAppToast } from "@/components/AppToastProvider";

function requesterLabel(user: PendingLineAccountRequestPublic["requestedBy"]) {
  return user.name ?? user.ldapUsername ?? user.email ?? "—";
}

function ApproveRequestButton({ requestId }: { requestId: string }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/line-account-requests/${requestId}/approve`,
        { method: "POST" },
      );
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        const message = data.error ?? "อนุมัติไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setLoading(false);

        return;
      }
      onOpenChange();
      toast.success("อนุมัติคำขอแล้ว");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      toast.error("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <>
      <Button color="success" size="sm" variant="flat" onPress={onOpen}>
        อนุมัติ
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>อนุมัติคำขอ LINE OA</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <p>สร้างบัญชี LINE OA และมอบสิทธิ์ให้ผู้ขอใช่หรือไม่?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => onOpenChange()}>
              ยกเลิก
            </Button>
            <Button color="success" isLoading={loading} onPress={handleApprove}>
              อนุมัติ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function RejectRequestButton({ requestId }: { requestId: string }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const toast = useAppToast();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReject() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/line-account-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        const message = data.error ?? "ปฏิเสธไม่สำเร็จ";

        setError(message);
        toast.error(message);
        setLoading(false);

        return;
      }
      onOpenChange();
      setReason("");
      toast.success("ปฏิเสธคำขอแล้ว");
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
        ปฏิเสธ
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>ปฏิเสธคำขอ LINE OA</ModalHeader>
          <ModalBody>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <Textarea
              isRequired
              label="เหตุผลในการปฏิเสธ"
              minRows={3}
              value={reason}
              onValueChange={setReason}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => onOpenChange()}>
              ยกเลิก
            </Button>
            <Button
              color="danger"
              isDisabled={reason.trim().length === 0}
              isLoading={loading}
              onPress={handleReject}
            >
              ปฏิเสธคำขอ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export function PendingLineAccountRequestsCard({
  requests,
  count,
}: {
  requests: PendingLineAccountRequestPublic[];
  count: number;
}) {
  if (count === 0) return null;

  return (
    <Card className="border border-warning-300 shadow-none">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-warning-700">
            คำขอ LINE OA รออนุมัติ
          </p>
          <p className="text-sm text-default-500">
            {count.toLocaleString("th-TH")} รายการ (แสดงล่าสุด{" "}
            {Math.min(requests.length, 5)} รายการ)
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-2 border-b border-default-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-semibold text-foreground">{request.name}</p>
              <p className="text-default-600">
                ผู้ขอ: {requesterLabel(request.requestedBy)}
              </p>
              <p className="font-mono text-xs text-default-500">
                Channel: {request.channelId}
              </p>
              <p className="text-xs text-default-500">
                {request.createdAt.toLocaleDateString("th-TH")}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <ApproveRequestButton requestId={request.id} />
              <RejectRequestButton requestId={request.id} />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
