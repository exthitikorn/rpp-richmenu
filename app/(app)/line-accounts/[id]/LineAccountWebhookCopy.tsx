"use client";

import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";

import { useAppToast } from "@/components/AppToastProvider";
import { copyToClipboard } from "@/lib/copy-to-clipboard";

function CopyRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-default-600">{label}</p>
      <div className="flex min-w-0 items-start gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg bg-default-100 px-3 py-2 text-sm">
          {value}
        </code>
        <Button
          aria-label={`คัดลอก ${label}`}
          className="shrink-0"
          size="sm"
          variant="bordered"
          onPress={onCopy}
        >
          คัดลอก
        </Button>
      </div>
    </div>
  );
}

export function LineAccountWebhookCopy({
  channelId,
  webhookUrl,
}: {
  channelId: string;
  webhookUrl: string | null;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const toast = useAppToast();

  const copy = async (label: string, value: string) => {
    const ok = await copyToClipboard(value);

    if (ok) toast.success(`คัดลอก ${label} แล้ว`);
    else toast.error(`คัดลอก ${label} ไม่สำเร็จ`);
  };

  return (
    <>
      <Button variant="bordered" onPress={onOpen}>
        Webhook
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        placement="center"
        size="lg"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Webhook
                <p className="text-sm font-normal text-default-500">
                  คัดลอกไปใส่ใน LINE Developers → Messaging API → Webhook URL
                </p>
              </ModalHeader>
              <ModalBody className="gap-4">
                <CopyRow
                  label="Channel ID"
                  value={channelId}
                  onCopy={() => copy("Channel ID", channelId)}
                />
                {webhookUrl ? (
                  <CopyRow
                    label="Webhook URL"
                    value={webhookUrl}
                    onCopy={() => copy("Webhook URL", webhookUrl)}
                  />
                ) : (
                  <p className="text-sm text-warning">
                    ตั้ง NEXTAUTH_URL ใน .env เพื่อสร้าง Webhook URL
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
