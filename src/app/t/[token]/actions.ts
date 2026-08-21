"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activityPhase } from "@/lib/activity-phase";

export async function startPosttestRetry(token: string) {
  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { activity: true, attempts: true },
  });
  if (
    !participant ||
    activityPhase(participant.activity, new Date()) !== "POSTTEST"
  ) {
    return;
  }

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
