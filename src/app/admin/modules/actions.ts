"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { moduleCreateSchema, moduleSettingsSchema } from "@/lib/schemas";

const questionCreateSchema = z.object({
  moduleId: z.string().min(1),
  text: z.string().min(3, "Soal minimal 3 karakter"),
  explanation: z.string().optional(),
});

const videoUrlField = z
  .string()
  .trim()
  .refine(
    (v) =>
      v === "" ||
      v.startsWith("/uploads/") ||
      /^https?:\/\/.+/.test(v),
    "URL video tidak valid"
  );

const pdfUrlField = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || v.startsWith("/uploads/pdfs/"),
    "Lampiran PDF tidak valid"
  );

const materialSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(3, "Judul materi minimal 3 karakter"),
  content: z
    .string()
    .refine(
      (v) => v.replace(/<[^>]*>/g, "").trim().length >= 1,
      "Konten tidak boleh kosong"
    ),
  videoUrl: videoUrlField.optional(),
  pdfUrl: pdfUrlField.optional(),
});

type FormState = { error?: string; ok?: boolean; questionId?: string };

export async function createModule(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = moduleCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const mod = await prisma.module.create({
    data: { title: parsed.data.title, description: parsed.data.description },
  });

  revalidatePath("/admin/modules");
  redirect(`/admin/modules/${mod.id}`);
}

type SettingsState = { ok?: boolean; error?: string };

export async function updateModuleSettings(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
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
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { moduleId, ...data } = parsed.data;

  await prisma.module.update({ where: { id: moduleId }, data });

  revalidatePath(`/admin/modules/${moduleId}`);

  return { ok: true };
}

export async function createQuestion(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = questionCreateSchema.safeParse({
    moduleId: formData.get("moduleId"),
    text: formData.get("text"),
    explanation: formData.get("explanation") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const last = await prisma.question.findFirst({
    where: { moduleId: parsed.data.moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const question = await prisma.question.create({
    data: {
      moduleId: parsed.data.moduleId,
      section: "PRETEST",
      text: parsed.data.text,
      explanation: parsed.data.explanation || null,
      order: (last?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/admin/modules/${parsed.data.moduleId}`);
  return { ok: true, questionId: question.id };
}

export async function updateQuestion(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const text = String(formData.get("text"));

  if (text.trim().length < 3) return { error: "Soal minimal 3 karakter" };

  await prisma.question.update({
    where: { id: questionId },
    data: { text },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
  return {};
}

export async function updateExplanation(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const explanation = String(formData.get("explanation") || "").trim();

  await prisma.question.update({
    where: { id: questionId },
    data: { explanation: explanation || null },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
  return {};
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

export async function addOption(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const text = String(formData.get("text"));

  if (text.trim().length < 1) return { error: "Opsi tidak boleh kosong" };

  await prisma.option.create({
    data: {
      questionId,
      text,
      isCorrect: false,
    },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
  return {};
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

export async function deleteOption(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const optionId = String(formData.get("optionId"));
  const moduleId = String(formData.get("moduleId"));

  const option = await prisma.option.findUnique({ where: { id: optionId } });
  if (!option) return {};
  if (option.isCorrect)
    return { error: "Jawaban benar tidak bisa dihapus. Ubah jawaban benar dulu." };

  await prisma.option.delete({ where: { id: optionId } });

  revalidatePath(`/admin/modules/${moduleId}`);
  return {};
}

export async function createMaterial(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = materialSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl") || "",
    pdfUrl: formData.get("pdfUrl") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { moduleId, videoUrl, pdfUrl, ...data } = parsed.data;

  const last = await prisma.material.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.material.create({
    data: {
      ...data,
      moduleId,
      videoUrl: videoUrl || null,
      pdfUrl: pdfUrl || null,
      order: (last?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
  return {};
}

export async function updateMaterial(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const materialId = String(formData.get("materialId"));
  const moduleId = String(formData.get("moduleId"));

  const parsed = materialSchema.safeParse({
    moduleId,
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl") || "",
    pdfUrl: formData.get("pdfUrl") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { videoUrl, pdfUrl, ...data } = parsed.data;

  await prisma.material.update({
    where: { id: materialId },
    data: { ...data, videoUrl: videoUrl || null, pdfUrl: pdfUrl || null },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
  return {};
}

export async function deleteMaterial(formData: FormData) {
  const materialId = String(formData.get("materialId"));
  const moduleId = String(formData.get("moduleId"));

  await prisma.material.delete({ where: { id: materialId } });

  revalidatePath(`/admin/modules/${moduleId}`);
}
