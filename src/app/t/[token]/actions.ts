"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function startPosttestRetry(token: string) {
  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { activity: true, attempts: true },
  });
  if (!participant || participant.activity.status !== "POSTTEST_OPEN") return;

  const hasPassed = participant.attempts.some(
    (a) => a.section === "POSTTEST" && a.passed
  );
  const hasActive = participant.attempts.some(
    (a) => a.section === "POSTTEST" && !a.submittedAt
  );
  if (hasPassed || hasActive) return;

  await prisma.attempt.create({
    data: {
      participantId: participant.id,
      section: "POSTTEST",
      seed: Math.floor(Math.random() * 2 ** 31),
    },
  });

  revalidatePath(`/t/${token}`);
}
