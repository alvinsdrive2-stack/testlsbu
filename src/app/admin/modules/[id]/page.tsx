import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { QuestionSection } from "./QuestionSection";
import { MaterialSection } from "./MaterialSection";
import { QueryToast } from "@/components/ui/QueryToast";

export default async function ModuleBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mod = await prisma.module.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: true },
      },
      materials: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!mod) notFound();

  return (
    <AdminShell title={mod.title} eyebrow="Modul">
      <QueryToast success={{ created: "Modul berhasil dibuat" }} />
      <Link
        href="/admin/modules"
        className="text-sm font-medium text-accent hover:underline"
      >
        ← Kembali ke daftar modul
      </Link>
      <SettingsForm module={mod} />
      <QuestionSection moduleId={mod.id} questions={mod.questions} />
      <MaterialSection moduleId={mod.id} materials={mod.materials} />
    </AdminShell>
  );
}
