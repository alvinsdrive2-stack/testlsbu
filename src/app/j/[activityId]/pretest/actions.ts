"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activityPhase } from "@/lib/activity-phase";
import { getParticipantToken } from "@/lib/session";

export type PretestFormState = { error?: string };

export async function startPretest(
  _prev: PretestFormState,
  formData: FormData
): Promise<PretestFormState> {
  const activityId = String(formData.get("activityId"));

  try {
    const token = await getParticipantToken();
    if (!token) {
      return { error: "Sesi kamu sudah berakhir. Login ulang dulu." };
    }

    const participant = await prisma.participant.findUnique({
      where: { token },
      include: { activity: true },
    });
    if (!participant || participant.activityId !== activityId) {
      return { error: "Data peserta tidak ditemukan. Muat ulang halaman." };
    }
    if (activityPhase(participant.activity, new Date()) !== "PRETEST") {
      return { error: "Sesi pretest belum berlangsung atau sudah ditutup." };
    }

    const existing = await prisma.attempt.findFirst({
      where: {
        participantId: participant.id,
        section: "PRETEST",
        submittedAt: null,
      },
    });
    if (existing) {
      return {
        error: "Kamu sudah punya pretest yang sedang berjalan. Muat ulang halaman.",
      };
    }

    await prisma.attempt.create({
      data: {
        participantId: participant.id,
        section: "PRETEST",
        seed: Math.floor(Math.random() * 2 ** 31),
      },
    });

    revalidatePath(`/j/${activityId}/pretest`);
    return {};
  } catch {
    return { error: "Gagal memulai pretest. Coba lagi." };
  }
}
