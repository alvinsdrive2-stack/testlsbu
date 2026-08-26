"use server";

import { prisma } from "@/lib/prisma";
import { generateCertificateNumber } from "@/lib/certificate";
import { revalidatePath } from "next/cache";

type CertificateState = { error?: string; certificateNumber?: string };

export async function generateCertificate(
  _prev: CertificateState,
  formData: FormData
): Promise<CertificateState> {
  const participantId = String(formData.get("participantId"));

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { activity: { include: { module: true } } },
  });

  if (!participant) {
    return { error: "Peserta tidak ditemukan" };
  }

  if ((participant as any).certificateNumber) {
    return { error: "Sertifikat sudah diterbitkan" };
  }

  if (participant.stage !== "POSTTEST_PASSED") {
    return { error: "Peserta belum lulus posttest" };
  }

  const date = new Date();
  const year = date.getFullYear();

  const lastCert = await prisma.participant.findFirst({
    where: {
      certificateNumber: { contains: `/GAPENSI/*/` + year },
    },
    orderBy: { certificateIssuedAt: "desc" },
  } as any);

  let nextSequence = 1;
  if (lastCert?.certificateNumber) {
    const match = lastCert.certificateNumber.match(/(\d+)\/PUB\/GAPENSI\//);
    if (match) {
      nextSequence = parseInt(match[1]) + 1;
    }
  }

  const certificateNumber = generateCertificateNumber(nextSequence);

  await prisma.participant.update({
    where: { id: participantId },
    data: {
      certificateNumber,
      certificateIssuedAt: new Date(),
    },
  } as any);

  revalidatePath(`/admin/activities/${participant.activity.id}`);

  return { certificateNumber };
}
