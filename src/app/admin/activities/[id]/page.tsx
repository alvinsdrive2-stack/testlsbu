import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { advanceActivityStatus, deleteActivity } from "../actions";
import { CopyLink } from "./CopyLink";

const STATUS_LABEL: Record<string, string> = {
  PRETEST_OPEN: "Pretest dibuka",
  POSTTEST_OPEN: "Posttest dibuka",
  CLOSED: "Ditutup",
};

const NEXT_ACTION_LABEL: Record<string, string> = {
  PRETEST_OPEN: "Buka Posttest",
  POSTTEST_OPEN: "Tutup Kegiatan",
};

const STAGE_LABEL: Record<string, string> = {
  REGISTERED: "Terdaftar",
  PRETEST_DONE: "Pretest selesai",
  POSTTEST_PASSED: "Lulus posttest",
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      module: true,
      participants: {
        orderBy: { createdAt: "asc" },
        include: {
          attempts: { select: { section: true, score: true, passed: true } },
        },
      },
    },
  });

  if (!activity) notFound();

  const joinPath = `/j/${activity.id}`;
  const nextAction = NEXT_ACTION_LABEL[activity.status];

  return (
    <AdminShell title={activity.title}>
      <Card className="p-6">
        <p className="text-sm text-ink-secondary">Modul: {activity.module.title}</p>
        <p className="mt-1 text-h2 font-semibold">
          Status: {STATUS_LABEL[activity.status]}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {nextAction ? (
            <form action={advanceActivityStatus}>
              <input type="hidden" name="activityId" value={activity.id} />
              <Button type="submit">{nextAction}</Button>
            </form>
          ) : null}
          <form action={deleteActivity}>
            <input type="hidden" name="activityId" value={activity.id} />
            <Button variant="danger" type="submit">
              Hapus Kegiatan
            </Button>
          </form>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <p className="text-h2 font-semibold">Link</p>
        <CopyLink path={joinPath} label="Link pendaftaran peserta (pretest)" />
        {activity.status === "POSTTEST_OPEN" ? (
          <div className="space-y-2 border-t border-hairline pt-4">
            <p className="text-sm font-medium">Link posttest per peserta</p>
            {activity.participants.length === 0 ? (
              <p className="text-sm text-ink-secondary">
                Belum ada peserta terdaftar.
              </p>
            ) : (
              activity.participants.map((p) => (
                <CopyLink key={p.id} path={`/t/${p.token}`} label={p.nama} />
              ))
            )}
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <p className="text-h2 font-semibold">Peserta</p>
        {activity.participants.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Belum ada peserta terdaftar.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-ink-secondary">
                  <th className="py-2 pr-4 font-medium">Nama</th>
                  <th className="py-2 pr-4 font-medium">Badan Usaha</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Nilai Pretest</th>
                  <th className="py-2 pr-4 font-medium">Posttest Terbaik</th>
                </tr>
              </thead>
              <tbody>
                {activity.participants.map((p) => {
                  const pretest = p.attempts
                    .filter((a) => a.section === "PRETEST" && a.score !== null)
                    .map((a) => a.score!);
                  const pretestScore = pretest.length ? Math.max(...pretest) : null;
                  const postPassed = p.attempts
                    .filter((a) => a.section === "POSTTEST" && a.passed)
                    .map((a) => a.score!);
                  const postBest = postPassed.length ? Math.max(...postPassed) : null;

                  return (
                    <tr key={p.id} className="border-b border-hairline">
                      <td className="py-2 pr-4">{p.nama}</td>
                      <td className="py-2 pr-4 text-ink-secondary">{p.badanUsaha}</td>
                      <td className="py-2 pr-4">{STAGE_LABEL[p.stage]}</td>
                      <td className="py-2 pr-4">{pretestScore ?? "-"}</td>
                      <td className="py-2 pr-4">{postBest ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
