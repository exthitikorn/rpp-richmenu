"use client";

import { Chip } from "@heroui/chip";

import { useAppToast } from "@/components/AppToastProvider";

export function EditRichMenuHeaderMeta({
  aliasId,
  lineAccountName,
}: {
  aliasId: string;
  lineAccountName: string;
}) {
  const toast = useAppToast();

  const copyAliasId = () => {
    void navigator.clipboard.writeText(aliasId);
    toast.success("คัดลอก Alias ID แล้ว");
  };

  return (
    <>
      <Chip
        aria-label={`คัดลอก Alias ID ${aliasId}`}
        classNames={{
          base: "max-w-full h-7 cursor-pointer",
          content: "truncate text-tiny",
        }}
        color="primary"
        role="button"
        tabIndex={0}
        title="คลิกเพื่อคัดลอก"
        variant="flat"
        onClick={copyAliasId}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            copyAliasId();
          }
        }}
      >
        {aliasId}
      </Chip>
      <Chip
        classNames={{ base: "max-w-full h-7", content: "truncate" }}
        color="primary"
        variant="flat"
      >
        {lineAccountName}
      </Chip>
    </>
  );
}
