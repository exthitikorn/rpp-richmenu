import { Spinner } from "@heroui/spinner";

export default function UsersLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  );
}
