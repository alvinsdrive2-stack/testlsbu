"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { activityPhase } from "@/lib/activity-phase";
import { createParticipantSession } from "@/lib/session";

const registerSchema = z.object({
  activityId: z.string().min(1),
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  badanUsaha: z.string().min(3, "Nama badan usaha minimal 3 karakter"),
  npwp: z.string().min(5, "NPWP minimal 5 karakter"),
  wa: z.string().min(8, "No WA minimal 8 digit"),
  email: z.string().email("Email tidak valid"),
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
  if (!activity || activityPhase(activity, new Date()) !== "REGISTRATION") {
    return { error: "Kegiatan tidak tersedia. Hubungi admin." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.participant.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    if (existing.wa === parsed.data.wa) {
      await createParticipantSession(existing.token);
      redirect("/p");
    }
    return {
      error:
        "Email sudah digunakan oleh badan usaha lain. Silakan gunakan email lain atau login ke dashboard.",
    };
  }

  const participant = await prisma.participant.create({
    data: {
      activityId,
      nama: parsed.data.nama,
      badanUsaha: parsed.data.badanUsaha,
      npwp: parsed.data.npwp,
      wa: parsed.data.wa,
      email,
      isGapensiMember: parsed.data.isGapensiMember,
    },
  });

  await createParticipantSession(participant.token);
  redirect("/p");
}
