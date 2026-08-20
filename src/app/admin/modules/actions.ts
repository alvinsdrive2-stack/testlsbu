"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { moduleCreateSchema, moduleSettingsSchema } from "@/lib/schemas";

const questionCreateSchema = z.object({
  moduleId: z.string().min(1),
  section: z.enum(["PRETEST", "POSTTEST"]),
  text: z.string().min(3, "Soal minimal 3 karakter"),
});

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

export async function createQuestion(formData: FormData) {
  const parsed = questionCreateSchema.safeParse({
    moduleId: formData.get("moduleId"),
    section: formData.get("section"),
    text: formData.get("text"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const last = await prisma.question.findFirst({
    where: { moduleId: parsed.data.moduleId, section: parsed.data.section },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.question.create({
    data: {
      moduleId: parsed.data.moduleId,
      section: parsed.data.section,
      text: parsed.data.text,
      order: (last?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/admin/modules/${parsed.data.moduleId}`);
}

export async function updateQuestionText(formData: FormData) {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const text = String(formData.get("text"));

  if (text.trim().length < 3) throw new Error("Soal minimal 3 karakter");

  await prisma.question.update({ where: { id: questionId }, data: { text } });

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function deleteQuestion(formData: FormData) {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return;

  await prisma.question.delete({ where: { id: questionId } });

  const remaining = await prisma.question.findMany({
    where: { moduleId, section: question.section },
    orderBy: { order: "asc" },
  });

  let order = 1;
  for (const q of remaining) {
    await prisma.question.update({ where: { id: q.id }, data: { order } });
    order++;
  }

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function moveQuestion(formData: FormData) {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const direction = String(formData.get("direction")) as "up" | "down";

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return;

  const siblings = await prisma.question.findMany({
    where: { moduleId, section: question.section },
    orderBy: { order: "asc" },
  });

  const index = siblings.findIndex((q) => q.id === questionId);
  const swapWith = direction === "up" ? index - 1 : index + 1;

  if (swapWith < 0 || swapWith >= siblings.length) return;

  const reordered = [...siblings];
  [reordered[index], reordered[swapWith]] = [
    reordered[swapWith],
    reordered[index],
  ];

  let order = 1;
  for (const q of reordered) {
    await prisma.question.update({ where: { id: q.id }, data: { order } });
    order++;
  }

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function addOption(formData: FormData) {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const text = String(formData.get("text"));

  if (text.trim().length < 1) throw new Error("Opsi tidak boleh kosong");

  await prisma.option.create({
    data: {
      questionId,
      text,
      isCorrect: false,
    },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function setCorrectOption(formData: FormData) {
  const optionId = String(formData.get("optionId"));
  const moduleId = String(formData.get("moduleId"));

  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: { question: true },
  });
  if (!option) return;

  await prisma.$transaction([
    prisma.option.updateMany({
      where: { questionId: option.questionId },
      data: { isCorrect: false },
    }),
    prisma.option.update({
      where: { id: optionId },
      data: { isCorrect: true },
    }),
  ]);

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function deleteOption(formData: FormData) {
  const optionId = String(formData.get("optionId"));
  const moduleId = String(formData.get("moduleId"));

  await prisma.option.delete({ where: { id: optionId } });

  revalidatePath(`/admin/modules/${moduleId}`);
}
