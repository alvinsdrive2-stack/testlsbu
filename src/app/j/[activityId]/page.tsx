import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParticipantToken } from "@/lib/session";
import { Reveal } from "@/components/ui/Reveal";
import { JoinForm } from "./JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { module: { select: { title: true } } },
  });

  if (!activity) notFound();

  const token = await getParticipantToken();
  if (token) {
    const participant = await prisma.participant.findUnique({
      where: { token },
      select: { activityId: true },
    });
    if (participant?.activityId === activityId) {
      redirect("/p");
    }
  }

  if (activity.status === "CLOSED") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md border-y border-hairline py-12 text-center">
          <p className="label-eyebrow text-flag">Kegiatan ditutup</p>
          <p className="mt-3 text-h2 font-bold">Pendaftaran sudah berakhir</p>
          <p className="mt-2 text-sm text-ink-secondary">
            Hubungi admin untuk info lebih lanjut.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center px-6 py-16">
      <div className="mx-auto grid w-full max-w-4xl gap-14 md:grid-cols-2">
        <Reveal>
        <div>
          <p className="label-eyebrow text-flag">Pendaftaran Peserta</p>
          <h1 className="mt-3 text-[var(--text-h1)] font-bold leading-tight tracking-tight">
            {activity.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-secondary">
            Modul {activity.module.title}. Isi data diri di samping untuk
            memulai pretest.
          </p>
          <div className="mt-8 space-y-3 border-t border-hairline pt-6 text-[15px] text-ink-secondary">
            <p>1. Daftar dan kerjakan pretest</p>
            <p>2. Pelajari materi pelatihan</p>
            <p>3. Kerjakan posttest sampai lulus</p>
          </div>
        </div>
        </Reveal>

        <Reveal delay={80}>
        <div className="border border-hairline bg-surface p-8">
          <JoinForm activityId={activity.id} />
        </div>
        </Reveal>
      </div>
    </main>
  );
}
