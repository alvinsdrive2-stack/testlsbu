"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createParticipantSession } from "@/lib/session";
import { pickDefaultEnrollment } from "@/lib/enrollment";

export async function loginParticipant(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const wa = String(formData.get("wa") || "").trim();

  if (!email || !wa) {
    redirect("/login?error=1");
  }

  // Satu email = satu identitas. Kegiatan yang diikuti bisa lebih dari satu,
  // jadi yang dicari di sini `user`-nya, bukan pendaftarannya.
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      wa: true,
      participants: {
        select: {
          token: true,
          activity: {
            select: {
              registrationStart: true,
              pretestStart: true,
              materialStart: true,
              posttestStart: true,
              closedAt: true,
            },
          },
        },
      },
    },
  });

  if (!user || user.wa !== wa) {
    redirect("/login?error=1");
  }

  // Buka kegiatan yang paling relevan hari ini; sisanya bisa dipilih dari
  // daftar "Kegiatan kamu" di dashboard.
  const enrollment = pickDefaultEnrollment(user.participants, new Date());
  if (!enrollment) {
    redirect("/login?error=1");
  }

  await createParticipantSession(enrollment.token);
  redirect("/p");
}
