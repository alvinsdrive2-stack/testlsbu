"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const activityCreateSchema = z.object({
  moduleId: z.string().min(1, "Pilih modul"),
  title: z.string().min(3, "Judul minimal 3 karakter"),
});

export async function createActivity(formData: FormData) {
  const parsed = activityCreateSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const activity = await prisma.activity.create({
    data: { moduleId: parsed.data.moduleId, title: parsed.data.title },
  });

  revalidatePath("/admin/activities");
  redirect(`/admin/activities/${activity.id}`);
}

const NEXT_STATUS: Record<string, "POSTTEST_OPEN" | "CLOSED"> = {
  PRETEST_OPEN: "POSTTEST_OPEN",
  POSTTEST_OPEN: "CLOSED",
};

export async function advanceActivityStatus(formData: FormData) {
  const activityId = String(formData.get("activityId"));

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) return;

  const next = NEXT_STATUS[activity.status];
  if (!next) return;

  await prisma.activity.update({ where: { id: activityId }, data: { status: next } });

  revalidatePath(`/admin/activities/${activityId}`);
  revalidatePath("/admin/activities");
}

export async function deleteActivity(formData: FormData) {
  const activityId = String(formData.get("activityId"));

  await prisma.activity.delete({ where: { id: activityId } });

  revalidatePath("/admin/activities");
  redirect("/admin/activities");
}
