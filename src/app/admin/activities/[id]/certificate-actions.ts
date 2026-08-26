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
    select: {
      id: true,
      nama: true,
      badanUsaha: true,
      npwp: true,
      wa: true,
      email: true,
      stage: true,
      certificateNumber: true,
      certificateIssuedAt: true,
      activity: {
        select: {
          id: true,
          module: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!participant) {
    return { error: "Peserta tidak ditemukan" };
  }

  if (participant.certificateNumber) {
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
  });

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
  });

  revalidatePath(`/admin/activities/${participant.activityId}`);

  return { certificateNumber };
}
