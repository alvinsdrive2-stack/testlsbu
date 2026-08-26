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
    const lastCert = await prisma.participant.findFirst({
      where: {
        AND: [
          { certificateNumber: { contains: "GAPENSI/" } },
          { certificateNumber: { endsWith: `/${year}` } },
        ],
      },
      orderBy: { certificateIssuedAt: "desc" },
    });

    let nextSequence = 1;
    if (lastCert?.certificateNumber) {
      const match = lastCert.certificateNumber.match(/(\d+)\/PUB\/GAPENSI\//);
      if (match) {
        nextSequence = parseInt(match[1]) + 1;
      }
    }

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
