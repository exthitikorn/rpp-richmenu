"use client";

import { SessionProvider } from "next-auth/react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";

import { AppToastProvider } from "@/components/AppToastProvider";

export interface ProvidersProps {
  children: React.ReactNode;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children }: ProvidersProps) {
  const router = useRouter();

  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <AppToastProvider>{children}</AppToastProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
