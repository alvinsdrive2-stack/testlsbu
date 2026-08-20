import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParticipantToken } from "@/lib/session";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { registerParticipant } from "./actions";

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
      <div className="mx-auto grid w-full max-w-4xl gap-12 md:grid-cols-2">
        <div>
          <p className="label-eyebrow text-flag">Pendaftaran Peserta</p>
          <h1 className="mt-3 text-[var(--text-h1)] font-bold leading-tight tracking-tight">
            {activity.title}
          </h1>
          <p className="mt-4 leading-relaxed text-ink-secondary">
            Modul {activity.module.title}. Isi data diri di samping untuk
            memulai pretest.
          </p>
          <div className="mt-8 space-y-3 border-t border-hairline pt-6 text-sm text-ink-secondary">
            <p>1. Daftar dan kerjakan pretest</p>
            <p>2. Pelajari materi pelatihan</p>
            <p>3. Kerjakan posttest sampai lulus</p>
          </div>
        </div>

        <div className="border border-hairline bg-surface p-8">
          <form action={registerParticipant} className="space-y-5">
            <input type="hidden" name="activityId" value={activity.id} />
            <TextField label="Nama peserta" name="nama" required minLength={3} />
            <TextField
              label="Nama badan usaha jasa konstruksi"
              name="badanUsaha"
              required
              minLength={3}
            />
            <TextField label="NPWP badan usaha" name="npwp" required minLength={5} />
            <TextField label="No WA" name="wa" required minLength={8} />
            <TextField label="Email aktif" name="email" type="email" required />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isGapensiMember"
                className="size-4 accent-[#002b66]"
              />
              Anggota Gapensi
            </label>
            <Button type="submit" className="w-full">
              Mulai Pretest
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
