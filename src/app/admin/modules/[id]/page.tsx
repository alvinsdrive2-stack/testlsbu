import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { QuestionSection } from "./QuestionSection";

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
    },
  });

  if (!mod) notFound();

  const pretest = mod.questions.filter((q) => q.section === "PRETEST");
  const posttest = mod.questions.filter((q) => q.section === "POSTTEST");

  return (
    <AdminShell title={mod.title}>
      <SettingsForm module={mod} />
      <QuestionSection moduleId={mod.id} section="PRETEST" questions={pretest} />
      <QuestionSection moduleId={mod.id} section="POSTTEST" questions={posttest} />
    </AdminShell>
  );
}
