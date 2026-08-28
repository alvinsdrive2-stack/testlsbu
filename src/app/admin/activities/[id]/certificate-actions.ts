"use server";

import { prisma } from "@/lib/prisma";
import { generateCertificateNumber } from "@/lib/certificate";
import { revalidatePath } from "next/cache";
import type { ActionFormState } from "@/components/ui/ActionForm";

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

  const year = new Date().getFullYear();

  try {
    // Counter per tahun di CertificateConfig — increment atomik, aman dari
    // dua admin yang menerbitkan sertifikat bersamaan.
    const counterId = `cert-seq-${year}`;
    const issuedThisYear = await prisma.participant.count({
      where: {
        certificateNumber: { not: null },
        certificateIssuedAt: {
          gte: new Date(`${year}-01-01T00:00:00`),
          lt: new Date(`${year + 1}-01-01T00:00:00`),
        },
      },
    });

    const nextSequence = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO certificate_config (id, fields, updatedAt)
        VALUES (${counterId}, JSON_OBJECT('seq', ${issuedThisYear + 1}), NOW())
        ON DUPLICATE KEY UPDATE
          fields = JSON_SET(fields, '$.seq', JSON_EXTRACT(fields, '$.seq') + 1),
          updatedAt = NOW()`;
      const rows = await tx.$queryRaw<{ seq: number | bigint }[]>`
        SELECT JSON_EXTRACT(fields, '$.seq') AS seq
        FROM certificate_config WHERE id = ${counterId}`;
      return Number(rows[0].seq);
    });

    await prisma.participant.update({
      where: { id: participantId },
      data: {
        certificateNumber: generateCertificateNumber(nextSequence),
        certificateIssuedAt: new Date(),
      },
    });

    revalidatePath(`/admin/activities/${participant.activity.id}`);
    return { ok: true };
  } catch {
    return { error: "Gagal membuat sertifikat. Coba lagi." };
  }
}
