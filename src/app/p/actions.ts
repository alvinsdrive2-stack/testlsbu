"use server";

import { redirect } from "next/navigation";
import { destroyParticipantSession } from "@/lib/session";

export async function logout() {
  await destroyParticipantSession();
  redirect("/");
}
