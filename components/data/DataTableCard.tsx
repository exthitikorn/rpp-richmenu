import type { ReactNode } from "react";

import { Card, CardBody, CardHeader } from "@heroui/card";

interface DataTableCardProps {
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  emptyState?: ReactNode;
  isEmpty?: boolean;
}

export function DataTableCard({
  title,
  description,
  headerActions,
  children,
  emptyState,
  isEmpty = false,
}: DataTableCardProps) {
  return (
    <Card className="w-full min-w-0 overflow-hidden">
      {title || description || headerActions ? (
        <CardHeader className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <p className="text-sm font-semibold">{title}</p> : null}
            {description ? (
              <p className="text-xs text-default-500">{description}</p>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex shrink-0 flex-wrap gap-2">{headerActions}</div>
          ) : null}
        </CardHeader>
      ) : null}
      <CardBody className="min-w-0 overflow-x-auto px-4 py-3">
        {isEmpty && emptyState ? emptyState : children}
      </CardBody>
    </Card>
  );
}
