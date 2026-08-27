"use client";

import { useEffect, useRef } from "react";
import { toastError, toastSuccess } from "@/lib/toast";

type ActionStateLike = { error?: string; ok?: boolean };

export function useActionToast(
  state: ActionStateLike,
  options?: { success?: string }
) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error) {
      toastError(state.error);
    } else if (state.ok) {
      toastSuccess(options?.success ?? "Berhasil disimpan");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
