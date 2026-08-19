"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { moduleCreateSchema } from "@/lib/schemas";

export async function createModule(formData: FormData) {
  const parsed = moduleCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const module = await prisma.module.create({
    data: { title: parsed.data.title, description: parsed.data.description },
  });

  revalidatePath("/admin/modules");
  redirect(`/admin/modules/${module.id}`);
}
