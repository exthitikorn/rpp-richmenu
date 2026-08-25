import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  header?: ReactNode;
}

export function AuthCard({ children, header }: AuthCardProps) {
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-lg rounded-xl border border-default-200 bg-content1 shadow-sm sm:max-w-xl">
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
    </div>
  );
}
