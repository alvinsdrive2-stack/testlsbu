import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { prisma } from "@/lib/prisma";
import { advanceActivityStatus, deleteActivity } from "../actions";
import { CopyLink } from "./CopyLink";
import { CopyAllLinks } from "./CopyAllLinks";

type Stage = "REGISTERED" | "PRETEST_DONE" | "POSTTEST_PASSED";

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

const PAGE_SIZE = 25;

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: "REGISTERED", label: "Terdaftar" },
  { value: "PRETEST_DONE", label: "Pretest selesai" },
  { value: "POSTTEST_PASSED", label: "Lulus posttest" },
];

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; stage?: string; page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const stage = typeof sp.stage === "string" ? sp.stage : "";
  const rawPage = Number(sp.page);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { module: true },
  });
  if (!activity) notFound();

  const where: Prisma.ParticipantWhereInput = {
    activityId: id,
    ...(q
      ? { OR: [{ nama: { contains: q } }, { badanUsaha: { contains: q } }] }
      : {}),
    ...(STAGE_OPTIONS.some((o) => o.value === stage)
      ? { stage: stage as Stage }
      : {}),
  };

  const [total, participants, stageRows, posttestParticipants] =
    await Promise.all([
      prisma.participant.count({ where }),
      prisma.participant.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          attempts: { select: { section: true, score: true, passed: true } },
        },
      }),
      prisma.participant.groupBy({
        by: ["stage"],
        where: { activityId: id },
        _count: { _all: true },
      }),
      activity.status === "POSTTEST_OPEN"
        ? prisma.participant.findMany({
            where: { activityId: id },
            orderBy: { createdAt: "asc" },
            select: { nama: true, token: true },
          })
        : Promise.resolve([]),
    ]);

  const totalParticipants = stageRows.reduce((s, r) => s + r._count._all, 0);
  const stageCounts = { REGISTERED: 0, PRETEST_DONE: 0, POSTTEST_PASSED: 0 };
  for (const r of stageRows) stageCounts[r.stage] += r._count._all;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (stage) params.set("stage", stage);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/admin/activities/${id}?${s}` : `/admin/activities/${id}`;
  };

  const joinPath = `/j/${activity.id}`;
  const nextAction = NEXT_ACTION_LABEL[activity.status];

  return (
    <AdminShell title={activity.title} eyebrow={activity.module.title}>
      <section className="rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
        <p className="label-eyebrow text-ink-secondary">Status kegiatan</p>
        <p className="mt-1 text-h1 font-bold text-accent">
          {STATUS_LABEL[activity.status]}
        </p>
        {totalParticipants > 0 ? (
          <p className="mt-3 text-sm tabular-nums text-ink-secondary">
            {totalParticipants} peserta · {stageCounts.REGISTERED} terdaftar ·{" "}
            {stageCounts.PRETEST_DONE} pretest selesai ·{" "}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h2 font-semibold">Link</h2>
          {activity.status === "POSTTEST_OPEN" ? (
            <CopyAllLinks rows={posttestParticipants} />
          ) : null}
        </div>
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface px-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          <div className="divide-y divide-hairline">
            <div className="py-4">
              <CopyLink path={joinPath} label="Link pendaftaran peserta (pretest)" />
            </div>
            {activity.status === "POSTTEST_OPEN"
              ? participants.map((p) => (
                  <div key={p.id} className="py-4">
                    <CopyLink path={`/t/${p.token}`} label={`Posttest · ${p.nama}`} />
                  </div>
                ))
              : null}
          </div>
        </div>
        {activity.status === "POSTTEST_OPEN" &&
        posttestParticipants.length === 0 ? (
          <p className="text-sm text-ink-secondary">Belum ada peserta terdaftar.</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-h2 font-semibold">Peserta</h2>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label
                htmlFor="q"
                className="label-eyebrow mb-1.5 block text-ink-secondary"
              >
                Cari
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Nama atau badan usaha"
                className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="stage"
                className="label-eyebrow mb-1.5 block text-ink-secondary"
              >
                Status
              </label>
              <select
                id="stage"
                name="stage"
                defaultValue={stage}
                className="rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Semua</option>
                {STAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>
        </div>

        {totalParticipants === 0 ? (
          <p className="text-sm text-ink-secondary">Belum ada peserta terdaftar.</p>
        ) : participants.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            Tidak ada peserta yang cocok dengan filter.{" "}
            <Link href={`/admin/activities/${id}`} className="font-medium text-accent">
              Reset filter
            </Link>
          </p>
        ) : (
          <>
            <p className="text-sm tabular-nums text-ink-secondary">
              Menampilkan {start}–{end} dari {total}
            </p>
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-hairline bg-surface px-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
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
                        className="py-3 pr-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => {
                    const pretest = p.attempts
                      .filter((a) => a.section === "PRETEST" && a.score !== null)
                      .map((a) => a.score!);
                    const pretestScore = pretest.length
                      ? Math.max(...pretest)
                      : null;
                    const postPassed = p.attempts
                      .filter((a) => a.section === "POSTTEST" && a.passed)
                      .map((a) => a.score!);
                    const postBest = postPassed.length
                      ? Math.max(...postPassed)
                      : null;

                    return (
                      <tr key={p.id} className="border-b border-hairline">
                        <td className="py-3 pr-6 font-medium">{p.nama}</td>
                        <td className="py-3 pr-6 text-ink-secondary">
                          {p.badanUsaha}
                        </td>
                        <td className="py-3 pr-6">{STAGE_LABEL[p.stage]}</td>
                        <td className="py-3 pr-6 tabular-nums">
                          {pretestScore ?? "—"}
                        </td>
                        <td className="py-3 pr-6 tabular-nums">
                          {postBest !== null ? (
                            <span className="font-semibold text-ink">
                              {postBest}
                            </span>
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
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-ink-secondary">
                  Halaman {safePage} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  {safePage > 1 ? (
                    <Link
                      href={qs(safePage - 1)}
                      className="inline-flex min-h-10 items-center rounded-md border border-hairline-strong bg-surface px-4 text-sm font-semibold hover:bg-canvas"
                    >
                      ← Sebelumnya
                    </Link>
                  ) : null}
                  {safePage < totalPages ? (
                    <Link
                      href={qs(safePage + 1)}
                      className="inline-flex min-h-10 items-center rounded-md border border-hairline-strong bg-surface px-4 text-sm font-semibold hover:bg-canvas"
                    >
                      Berikutnya →
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </AdminShell>
  );
}
