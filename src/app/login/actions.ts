"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createParticipantSession } from "@/lib/session";

export async function loginParticipant(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const wa = String(formData.get("wa") || "").trim();

  if (!email || !wa) {
    redirect("/login?error=1");
  }

  const participant = await prisma.participant.findFirst({
    where: { email, wa },
    orderBy: { createdAt: "desc" },
  });

  if (!participant) {
    redirect("/login?error=1");
  }

  await createParticipantSession(participant.token);
  redirect("/p");
}
