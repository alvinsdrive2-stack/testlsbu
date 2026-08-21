"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jakartaInputToDate } from "@/lib/activity-phase";

const activityCreateSchema = z.object({
  moduleId: z.string().min(1, "Pilih modul"),
  title: z.string().min(3, "Judul minimal 3 karakter"),
});

type FormState = { error?: string };

export async function createActivity(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = activityCreateSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const activity = await prisma.activity.create({
    data: { moduleId: parsed.data.moduleId, title: parsed.data.title },
  });

  revalidatePath("/admin/activities");
  redirect(`/admin/activities/${activity.id}`);
}

const SCHEDULE_FIELDS = [
  "registrationStart",
  "pretestStart",
  "materialStart",
  "posttestStart",
  "closedAt",
] as const;

type ScheduleState = { ok?: boolean; error?: string };

export async function updateActivitySchedule(
  _prev: ScheduleState,
  formData: FormData
): Promise<ScheduleState> {
  const activityId = String(formData.get("activityId"));

  const parsed: Record<(typeof SCHEDULE_FIELDS)[number], Date | null> = {} as Record<
    (typeof SCHEDULE_FIELDS)[number],
    Date | null
  >;
  for (const field of SCHEDULE_FIELDS) {
    const raw = String(formData.get(field) || "").trim();
    if (raw === "") {
      parsed[field] = null;
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
      return { error: "Format tanggal tidak valid" };
    }
    const d = jakartaInputToDate(raw);
    if (Number.isNaN(d.getTime())) {
      return { error: "Tanggal tidak valid" };
    }
    parsed[field] = d;
  }

  const order = SCHEDULE_FIELDS.map((f) => parsed[f]).filter(
    (d): d is Date => d !== null
  );
  for (let i = 1; i < order.length; i++) {
    if (order[i].getTime() < order[i - 1].getTime()) {
      return { error: "Urutan jadwal tidak boleh mundur" };
    }
  }

  await prisma.activity.update({ where: { id: activityId }, data: parsed });

  revalidatePath(`/admin/activities/${activityId}`);
  revalidatePath("/admin/activities");
  return { ok: true };
}

export async function deleteActivity(formData: FormData) {
  const activityId = String(formData.get("activityId"));

  await prisma.activity.delete({ where: { id: activityId } });

  revalidatePath("/admin/activities");
  redirect("/admin/activities");
}
