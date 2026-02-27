import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? (
          <p className="text-sm text-default-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
