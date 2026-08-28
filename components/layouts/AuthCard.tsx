import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  header?: ReactNode;
  aside?: ReactNode;
}

export function AuthCard({ children, header, aside }: AuthCardProps) {
  const formCard = (
    <div className="w-full rounded-xl border border-default-200 bg-content1 shadow-sm">
      {header ? (
        <div className="flex flex-col items-center gap-1 px-4 pb-0 pt-6 sm:px-8 sm:pt-8 md:px-12 lg:px-16">
          {header}
        </div>
      ) : null}
      <div
        className="px-4 pt-6 sm:px-8 md:px-12 lg:px-16"
        style={{
          paddingBottom:
            "max(1.5rem, calc(1rem + env(safe-area-inset-bottom, 0px)))",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (!aside) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg sm:max-w-xl">{formCard}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center px-4 py-6">
      <div className="grid w-full max-w-5xl grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-default-200 bg-content1 shadow-sm">
          {aside}
        </div>
        {formCard}
      </div>
    </div>
  );
}
