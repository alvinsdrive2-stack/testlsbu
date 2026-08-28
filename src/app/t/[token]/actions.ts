"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activityPhase } from "@/lib/activity-phase";

export type PosttestFormState = { error?: string; ok?: boolean };

export async function startPosttestRetry(
  _prev: PosttestFormState,
  formData: FormData
): Promise<PosttestFormState> {
  const token = String(formData.get("token"));

  try {
    const participant = await prisma.participant.findUnique({
      where: { token },
      select: {
        id: true,
        activity: {
          select: {
            registrationStart: true,
            pretestStart: true,
            materialStart: true,
            posttestStart: true,
            closedAt: true,
          },
        },
        attempts: {
          where: { section: "POSTTEST" },
          select: { passed: true, submittedAt: true },
        },
      },
    });
    if (
      !participant ||
      activityPhase(participant.activity, new Date()) !== "POSTTEST"
    ) {
      return { error: "Sesi posttest belum berlangsung atau sudah ditutup." };
    }

    const hasPassed = participant.attempts.some((a) => a.passed);
    const hasActive = participant.attempts.some((a) => !a.submittedAt);
    if (hasPassed) {
      return { error: "Kamu sudah lulus posttest." };
    }
    if (hasActive) {
      return {
        error: "Kamu sudah punya posttest yang sedang berjalan. Muat ulang halaman.",
      };
    }

    await prisma.attempt.create({
      data: {
        participantId: participant.id,
        section: "POSTTEST",
        seed: Math.floor(Math.random() * 2 ** 31),
      },
    });

    revalidatePath(`/t/${token}`);
    return { ok: true };
  } catch {
    return { error: "Gagal memulai posttest. Coba lagi." };
  }
}
