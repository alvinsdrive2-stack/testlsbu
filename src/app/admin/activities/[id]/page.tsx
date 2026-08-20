import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
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

const NEXT_ACTION_NOTE: Record<string, string> = {
  PRETEST_OPEN:
    "Setelah dibuka, peserta tidak bisa lagi mengerjakan pretest. Link posttest per peserta mulai aktif.",
  POSTTEST_OPEN:
    "Setelah ditutup, peserta tidak bisa lagi mengerjakan posttest. Nilai yang sudah masuk tetap tersimpan.",
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
  const stageCounts = { REGISTERED: 0, PRETEST_DONE: 0, POSTTEST_PASSED: 0 };
  for (const p of activity.participants) stageCounts[p.stage]++;

  return (
    <AdminShell title={activity.title} eyebrow={activity.module.title}>
      <section className="border-y border-hairline py-8">
        <p className="label-eyebrow text-ink-secondary">Status kegiatan</p>
        <p className="mt-1 text-h1 font-bold">
          {STATUS_LABEL[activity.status]}
        </p>
        {activity.participants.length > 0 ? (
          <p className="mt-3 text-sm tabular-nums text-ink-secondary">
            {activity.participants.length} peserta · {stageCounts.REGISTERED}{" "}
            terdaftar · {stageCounts.PRETEST_DONE} pretest selesai ·{" "}
            {stageCounts.POSTTEST_PASSED} lulus
          </p>
        ) : null}
        {nextAction ? (
          <>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
              {NEXT_ACTION_NOTE[activity.status]}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <form action={advanceActivityStatus}>
                <input type="hidden" name="activityId" value={activity.id} />
                <Button type="submit">{nextAction}</Button>
              </form>
              <form action={deleteActivity}>
                <input type="hidden" name="activityId" value={activity.id} />
                <ConfirmButton label="Hapus Kegiatan" />
              </form>
            </div>
          </>
        ) : (
          <form action={deleteActivity} className="mt-6">
            <input type="hidden" name="activityId" value={activity.id} />
            <ConfirmButton label="Hapus Kegiatan" />
          </form>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-h2 font-semibold">Link</h2>
        <div className="divide-y divide-hairline border-y border-hairline">
          <div className="py-4">
            <CopyLink path={joinPath} label="Link pendaftaran peserta (pretest)" />
          </div>
          {activity.status === "POSTTEST_OPEN"
            ? activity.participants.map((p) => (
                <div key={p.id} className="py-4">
                  <CopyLink path={`/t/${p.token}`} label={`Posttest · ${p.nama}`} />
                </div>
              ))
            : null}
        </div>
        {activity.status === "POSTTEST_OPEN" &&
        activity.participants.length === 0 ? (
          <p className="text-sm text-ink-secondary">Belum ada peserta terdaftar.</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-h2 font-semibold">Peserta</h2>
        {activity.participants.length === 0 ? (
          <p className="text-sm text-ink-secondary">Belum ada peserta terdaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline-strong text-left">
                  {[
                    "Nama",
                    "Badan Usaha",
                    "Status",
                    "Nilai Pretest",
                    "Posttest Terbaik",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-2 pr-6 text-xs font-semibold uppercase tracking-[0.12em] text-ink-secondary"
                    >
                      {h}
                    </th>
                  ))}
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
                      <td className="py-3 pr-6 font-medium">{p.nama}</td>
                      <td className="py-3 pr-6 text-ink-secondary">{p.badanUsaha}</td>
                      <td className="py-3 pr-6">{STAGE_LABEL[p.stage]}</td>
                      <td className="py-3 pr-6 tabular-nums">{pretestScore ?? "—"}</td>
                      <td className="py-3 pr-6 tabular-nums">
                        {postBest !== null ? (
                          <span className="font-semibold text-flag">{postBest}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
