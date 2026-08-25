import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  variant?: "default" | "hero";
  badges?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  variant = "default",
  badges,
}: PageHeaderProps) {
  const header = (
    <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
          {variant === "default" && badges ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {badges}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-default-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 flex-shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );

  if (variant === "hero") {
    return (
      <section className="rounded-xl border border-default-200 bg-content1 p-6">
        <div className="space-y-4">
          {header}
          {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
        </div>
      </section>
    );
  }

  return header;
}
