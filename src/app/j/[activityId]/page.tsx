import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParticipantToken } from "@/lib/session";
import { Card } from "@/components/ui/Card";
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
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center">
          <p className="text-h2 font-semibold">Kegiatan sudah ditutup</p>
          <p className="mt-2 text-sm text-ink-secondary">
            Hubungi admin untuk info lebih lanjut.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-[var(--text-hero)] font-semibold tracking-tight">
            {activity.title}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {activity.module.title} · Isi data diri untuk memulai pretest
          </p>
        </div>

        <Card className="p-6">
          <form action={registerParticipant} className="space-y-4">
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
        </Card>
      </div>
    </main>
  );
}
