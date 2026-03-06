"use client";

import type { ReactNode } from "react";

import { ToastProvider, addToast, closeAll } from "@heroui/toast";

export interface AppToastOptions {
  description?: string;
  timeout?: number;
}

export interface AppToast {
  success: (message: string, options?: AppToastOptions) => void;
  error: (message: string, options?: AppToastOptions) => void;
  info: (message: string, options?: AppToastOptions) => void;
  warning: (message: string, options?: AppToastOptions) => void;
  show: (message: string, options?: AppToastOptions) => void;
  clear: () => void;
}

export function useAppToast(): AppToast {
  return {
    success: (message, options) => {
      addToast({
        title: message,
        description: options?.description,
        timeout: options?.timeout,
        severity: "success",
      });
    },
    error: (message, options) => {
      addToast({
        title: message,
        description: options?.description,
        timeout: options?.timeout,
        severity: "danger",
      });
    },
    info: (message, options) => {
      addToast({
        title: message,
        description: options?.description,
        timeout: options?.timeout,
        severity: "primary",
      });
    },
    warning: (message, options) => {
      addToast({
        title: message,
        description: options?.description,
        timeout: options?.timeout,
        severity: "warning",
      });
    },
    show: (message, options) => {
      addToast({
        title: message,
        description: options?.description,
        timeout: options?.timeout,
      });
    },
    clear: () => {
      closeAll();
    },
  };
}

export function AppToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <ToastProvider
        placement="top-right"
        toastProps={{
          timeout: 4000,
          shouldShowTimeoutProgress: true,
        }}
      />
      {children}
    </>
  );
}
