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
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
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
      <section className="relative overflow-hidden rounded-2xl border border-primary-200/40 bg-gradient-to-br from-primary-100/60 via-background to-secondary-100/40 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-secondary-300/20 blur-3xl" />
        <div className="relative z-10 space-y-4">
          {header}
          {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
        </div>
      </section>
    );
  }

  return header;
}
