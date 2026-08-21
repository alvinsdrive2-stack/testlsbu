"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activityPhase } from "@/lib/activity-phase";
import { getParticipantToken } from "@/lib/session";

export async function startPretest(formData: FormData) {
  const activityId = String(formData.get("activityId"));

  const token = await getParticipantToken();
  if (!token) return;

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { activity: true },
  });
  if (!participant || participant.activityId !== activityId) return;
  if (activityPhase(participant.activity, new Date()) !== "PRETEST") return;

  const existing = await prisma.attempt.findFirst({
    where: {
      participantId: participant.id,
      section: "PRETEST",
      submittedAt: null,
    },
  });
  if (existing) return;

  await prisma.attempt.create({
    data: {
      participantId: participant.id,
      section: "PRETEST",
      seed: Math.floor(Math.random() * 2 ** 31),
    },
  });

  revalidatePath(`/j/${activityId}/pretest`);
}
