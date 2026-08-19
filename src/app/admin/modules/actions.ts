"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { moduleCreateSchema, moduleSettingsSchema } from "@/lib/schemas";

export async function createModule(formData: FormData) {
  const parsed = moduleCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const mod = await prisma.module.create({
    data: { title: parsed.data.title, description: parsed.data.description },
  });

  revalidatePath("/admin/modules");
  redirect(`/admin/modules/${mod.id}`);
}

export async function updateModuleSettings(formData: FormData) {
  const parsed = moduleSettingsSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    shuffleQuestions: formData.get("shuffleQuestions") === "on",
    shuffleOptions: formData.get("shuffleOptions") === "on",
    pretestDurationMin: formData.get("pretestDurationMin"),
    posttestDurationMin: formData.get("posttestDurationMin"),
    pretestPassingGrade: formData.get("pretestPassingGrade"),
    posttestPassingGrade: formData.get("posttestPassingGrade"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { moduleId, ...data } = parsed.data;

  await prisma.module.update({ where: { id: moduleId }, data });

  revalidatePath(`/admin/modules/${moduleId}`);
}
