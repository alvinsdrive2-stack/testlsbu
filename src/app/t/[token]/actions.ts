"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activityPhase } from "@/lib/activity-phase";

export type PosttestFormState = { error?: string };

export async function startPosttestRetry(
  _prev: PosttestFormState,
  formData: FormData
): Promise<PosttestFormState> {
  const token = String(formData.get("token"));

  try {
    const participant = await prisma.participant.findUnique({
      where: { token },
      include: { activity: true, attempts: true },
    });
    if (
      !participant ||
      activityPhase(participant.activity, new Date()) !== "POSTTEST"
    ) {
      return { error: "Sesi posttest belum berlangsung atau sudah ditutup." };
    }

    const hasPassed = participant.attempts.some(
      (a) => a.section === "POSTTEST" && a.passed
    );
    const hasActive = participant.attempts.some(
      (a) => a.section === "POSTTEST" && !a.submittedAt
    );
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
    return {};
  } catch {
    return { error: "Gagal memulai posttest. Coba lagi." };
  }
}
