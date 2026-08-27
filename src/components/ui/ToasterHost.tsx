"use client";

import { Toaster } from "sonner";
import type { ComponentProps } from "react";

type ToasterHostProps = ComponentProps<typeof Toaster>;

/** Satu-satunya tempat <Toaster/> dipasang (root layout). */
export function ToasterHost(props: Partial<ToasterHostProps>) {
  return (
    <Toaster
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-hairline-strong !bg-surface !text-ink !shadow-lg",
          description: "!text-ink-secondary",
        },
      }}
      {...props}
    />
  );
}
