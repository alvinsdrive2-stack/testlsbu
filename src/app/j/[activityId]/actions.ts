"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { activityPhase, isRegistrationOpen } from "@/lib/activity-phase";
import { createParticipantSession } from "@/lib/session";
import { participantFields } from "@/lib/schemas";

const registerSchema = z.object({
  activityId: z.string().min(1),
  ...participantFields,
  isGapensiMember: z.boolean(),
});

type RegisterState = { error?: string };

export async function registerParticipant(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const activityId = String(formData.get("activityId"));

  const parsed = registerSchema.safeParse({
    activityId,
    nama: formData.get("nama"),
    badanUsaha: formData.get("badanUsaha"),
    npwp: formData.get("npwp"),
    wa: formData.get("wa"),
    email: formData.get("email"),
    isGapensiMember: formData.get("isGapensiMember") === "ya",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    return { error: "Kegiatan tidak tersedia. Hubungi admin." };
  }
  if (!isRegistrationOpen(activity, new Date())) {
    const phase = activityPhase(activity, new Date());
    return {
      error:
        phase === "CLOSED"
          ? "Kegiatan sudah ditutup."
          : phase === "SCHEDULED"
            ? "Pendaftaran belum dibuka."
            : "Pendaftaran sedang ditutup. Hubungi admin.",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const profile = {
    nama: parsed.data.nama,
    badanUsaha: parsed.data.badanUsaha,
    npwp: parsed.data.npwp,
    wa: parsed.data.wa,
    isGapensiMember: parsed.data.isGapensiMember,
  };

  // Identitas dicari lintas kegiatan. Email yang sudah dipakai di pelatihan
  // lain BUKAN alasan menolak — peserta yang sama boleh ikut pelatihan di
  // hari berbeda. Penjaganya cukup nomor WA: kalau beda, berarti ada orang
  // lain yang memakai email ini.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && existingUser.wa !== parsed.data.wa) {
    return {
      error:
        "Email sudah digunakan oleh badan usaha lain. Silakan gunakan email lain atau login ke dashboard.",
    };
  }

  // Data yang diketik peserta sendiri di form dianggap paling baru.
  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: profile,
      })
    : await prisma.user.create({ data: { email, ...profile } });

  const enrollment = await prisma.participant.findUnique({
    where: { activityId_userId: { activityId, userId: user.id } },
    select: { token: true },
  });
  if (enrollment) {
    // Sudah terdaftar di kegiatan ini — daftar ulang cukup masuk kembali,
    // tidak bikin pendaftaran kedua.
    await createParticipantSession(enrollment.token);
    redirect("/p");
  }

  const participant = await prisma.participant.create({
    data: { activityId, userId: user.id },
  });

  await createParticipantSession(participant.token);
  redirect("/p?joined=1");
}
