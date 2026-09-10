"use client";

import { useActionState, useEffect } from "react";
import {
  generateAllCertificates,
  type BulkCertificateState,
} from "./certificate-actions";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { toastError, toastSuccess } from "@/lib/toast";

/**
 * Tombol sertifikat massal. Form selalu dirender walau count 0 supaya
 * komponen tetap terpasang saat revalidasi — toast hasil action tetap
 * sempat muncul setelah tombolnya menghilang.
 */
export function IssueAllCertificatesButton({
  activityId,
  count,
}: {
  activityId: string;
  count: number;
}) {
  const [state, formAction] = useActionState<BulkCertificateState, FormData>(
    generateAllCertificates,
    {}
  );

  useEffect(() => {
    if (state.ok && typeof state.issued === "number") {
      toastSuccess(`${state.issued} sertifikat berhasil diterbitkan`);
    } else if (state.error) {
      toastError(state.error);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="activityId" value={activityId} />
      {count > 0 ? (
        <ConfirmButton
          label={`Beri Semua Sertifikat (${count} peserta)`}
          confirmLabel={`Yakin? ${count} sertifikat diterbitkan`}
        />
      ) : null}
    </form>
  );
}
