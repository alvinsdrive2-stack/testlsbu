import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export default async function ModuleBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mod = await prisma.module.findUnique({ where: { id } });

  if (!mod) notFound();

  return (
    <AdminShell title={mod.title}>
      <SettingsForm module={mod} />
    </AdminShell>
  );
}
