"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jakartaInputToDate } from "@/lib/activity-phase";

const SCHEDULE_FIELDS = [
  "registrationStart",
  "pretestStart",
  "materialStart",
  "posttestStart",
  "closedAt",
] as const;

const SCHEDULE_LABEL: Record<(typeof SCHEDULE_FIELDS)[number], string> = {
  registrationStart: "Pendaftaran",
  pretestStart: "Pretest",
  materialStart: "Sesi materi",
  posttestStart: "Posttest",
  closedAt: "Tutup kegiatan",
};

function parseSchedule(
  formData: FormData
): Record<(typeof SCHEDULE_FIELDS)[number], Date> | { error: string } {
  const out = {} as Record<(typeof SCHEDULE_FIELDS)[number], Date>;
  for (const field of SCHEDULE_FIELDS) {
    const raw = String(formData.get(field) || "").trim();
    if (raw === "") {
      return { error: `Jadwal ${SCHEDULE_LABEL[field]} wajib diisi` };
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
      return { error: `Format tanggal ${SCHEDULE_LABEL[field]} tidak valid` };
    }
    const d = jakartaInputToDate(raw);
    if (Number.isNaN(d.getTime())) {
      return { error: `Tanggal ${SCHEDULE_LABEL[field]} tidak valid` };
    }
    out[field] = d;
  }
  for (let i = 1; i < SCHEDULE_FIELDS.length; i++) {
    const prev = out[SCHEDULE_FIELDS[i - 1]];
    const cur = out[SCHEDULE_FIELDS[i]];
    if (cur.getTime() < prev.getTime()) {
      return {
        error: `Jadwal ${SCHEDULE_LABEL[SCHEDULE_FIELDS[i]]} tidak boleh lebih awal dari ${SCHEDULE_LABEL[SCHEDULE_FIELDS[i - 1]]}`,
      };
    }
  }
  return out;
}

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

  // Mode quick (FAB modal) tidak mengirim jadwal — diisi nanti di detail.
  const hasSchedule = formData.get("registrationStart") !== null;
  const schedule = hasSchedule ? parseSchedule(formData) : null;
  if (schedule && "error" in schedule) {
    return { error: schedule.error };
  }

  const activity = await prisma.activity.create({
    data: {
      moduleId: parsed.data.moduleId,
      title: parsed.data.title,
      ...(schedule && !("error" in schedule) ? schedule : {}),
    },
  });

  revalidatePath("/admin/activities");
  redirect(`/admin/activities/${activity.id}`);
}

type ScheduleState = { ok?: boolean; error?: string };

export async function updateActivitySchedule(
  _prev: ScheduleState,
  formData: FormData
): Promise<ScheduleState> {
  const activityId = String(formData.get("activityId"));

  const parsed = parseSchedule(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
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

