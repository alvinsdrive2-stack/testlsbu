"use server";

import { prisma } from "@/lib/prisma";
import { issueCertificates } from "@/lib/certificate-issue";
import { revalidatePath } from "next/cache";
import type { ActionFormState } from "@/components/ui/ActionForm";

export type BulkCertificateState = {
  error?: string;
  ok?: boolean;
  issued?: number;
};

export async function generateCertificate(
  _prev: ActionFormState,
  formData: FormData
): Promise<ActionFormState> {
  const participantId = String(formData.get("participantId"));

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { activity: { include: { module: true } } },
  });

  if (!participant) return { error: "Peserta tidak ditemukan." };
  if (participant.certificateNumber)
    return { error: "Peserta ini sudah diberi sertifikat." };
  if (participant.stage !== "POSTTEST_PASSED")
    return { error: "Peserta belum lulus posttest." };

  try {
    const issued = await issueCertificates([participantId]);
    if (issued === 0)
      return { error: "Peserta ini sudah diberi sertifikat." };

    revalidatePath(`/admin/activities/${participant.activity.id}`);
    return { ok: true };
  } catch {
    return { error: "Gagal membuat sertifikat. Coba lagi." };
  }
}

/**
 * Terbitkan sertifikat untuk SEMUA peserta kegiatan yang belum punya,
 * tanpa peduli nilai atau apakah posttestnya pernah dikerjakan — atas
 * kebijakan admin. stage ikut di-set POSTTEST_PASSED.
 */
export async function generateAllCertificates(
  _prev: BulkCertificateState,
  formData: FormData
): Promise<BulkCertificateState> {
  const activityId = String(formData.get("activityId"));

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true },
  });
  if (!activity) return { error: "Kegiatan tidak ditemukan." };

  const pending = await prisma.participant.findMany({
    where: { activityId, certificateNumber: null },
    select: { id: true },
  });
  if (pending.length === 0)
    return { error: "Semua peserta sudah punya sertifikat." };

  try {
    const issued = await issueCertificates(pending.map((p) => p.id));
    revalidatePath(`/admin/activities/${activityId}`);
    return { ok: true, issued };
  } catch {
    return { error: "Gagal menerbitkan sertifikat massal. Coba lagi." };
  }
}
