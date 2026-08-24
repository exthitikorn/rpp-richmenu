import type { ReactNode } from "react";

import clsx from "clsx";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={clsx("w-full min-w-0 max-w-full space-y-6", className)}>
      {children}
    </div>
  );
}
