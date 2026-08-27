"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toastError, toastSuccess } from "@/lib/toast";

/**
 * Fire toast berdasarkan query param (misal ?created=1 / ?error=1),
 * lalu bersihkan param dari URL supaya tidak muncul lagi saat refresh.
 */
export function QueryToast({
  success,
  error,
}: {
  success?: Record<string, string>;
  error?: Record<string, string>;
}) {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let dirty = false;

    if (success) {
      for (const [key, message] of Object.entries(success)) {
        if (params.get(key)) {
          toastSuccess(message);
          params.delete(key);
          dirty = true;
        }
      }
    }
    if (error) {
      for (const [key, message] of Object.entries(error)) {
        if (params.get(key)) {
          toastError(message);
          params.delete(key);
          dirty = true;
        }
      }
    }

    if (dirty) {
      const qs = params.toString();
      router.replace(window.location.pathname + (qs ? `?${qs}` : ""), {
        scroll: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
