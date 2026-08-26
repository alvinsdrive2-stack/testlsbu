"use server";

import { prisma } from "@/lib/prisma";
import { generateCertificateNumber } from "@/lib/certificate";
import { revalidatePath } from "next/cache";

export async function generateCertificate(formData: FormData): Promise<void> {
  const participantId = String(formData.get("participantId"));

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { activity: { include: { module: true } } },
  });

  if (!participant) return;
  if (participant.certificateNumber) return;
  if (participant.stage !== "POSTTEST_PASSED") return;

  const year = new Date().getFullYear();

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
}
