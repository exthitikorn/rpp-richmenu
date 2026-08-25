import { Spinner } from "@heroui/spinner";

export function LoadingState({ label = "กำลังโหลด..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner color="primary" size="lg" />
      <p className="text-sm text-default-500">{label}</p>
    </div>
  );
}
