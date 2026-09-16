"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createParticipantSession,
  destroyParticipantSession,
  getParticipantToken,
} from "@/lib/session";

export async function logout() {
  await destroyParticipantSession();
  redirect("/login");
}

/**
 * Pindah ke pendaftaran lain milik user yang sama. Cookie sesi hanya bisa
 * menyimpan satu token, jadi kegiatan yang sedang dibuka ditentukan di sini.
 */
export async function switchEnrollment(formData: FormData) {
  const participantId = String(formData.get("participantId") || "");

  const currentToken = await getParticipantToken();
  if (!currentToken) redirect("/login");

  const current = await prisma.participant.findUnique({
    where: { token: currentToken },
    select: { userId: true },
  });
  if (!current) redirect("/login");

  const target = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { token: true, userId: true },
  });

  // Tanpa cek ini, peserta mana pun bisa membuka dashboard peserta lain
  // hanya dengan menebak id pendaftarannya.
  if (!target || target.userId !== current.userId) {
    redirect("/p?denied=1");
  }

  await createParticipantSession(target.token);
  redirect("/p");
}
