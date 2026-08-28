import Link from "next/link";
import type { Prisma, ParticipantStage } from "@prisma/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

const STAGE_LABEL: Record<ParticipantStage, string> = {
  REGISTERED: "Terdaftar",
  PRETEST_DONE: "Pretest selesai",
  POSTTEST_PASSED: "Lulus posttest",
};

const SORT_FIELDS = ["createdAt", "nama", "badanUsaha", "stage"] as const;
type SortField = (typeof SORT_FIELDS)[number];

const SORT_DEFAULT: SortField = "createdAt";
const SORT_DEFAULT_DIR = "desc" as const;

export default async function AdminParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const rawPage = Number(sp.page);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const sort = (SORT_FIELDS as readonly string[]).includes(sp.sort ?? "")
    ? (sp.sort as SortField)
    : SORT_DEFAULT;
  const dir = sp.dir === "asc" ? ("asc" as const) : ("desc" as const);

  const where: Prisma.ParticipantWhereInput = q
    ? {
        OR: [
          { nama: { contains: q } },
          { badanUsaha: { contains: q } },
          { email: { contains: q } },
          { wa: { contains: q } },
          { npwp: { contains: q } },
        ],
      }
    : {};

  const [total, participants] = await Promise.all([
    prisma.participant.count({ where }),
    prisma.participant.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { activity: { select: { id: true, title: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);

  const qs = (p: number, s: SortField, d: "asc" | "desc") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (s !== SORT_DEFAULT || d !== SORT_DEFAULT_DIR) {
      params.set("sort", s);
      params.set("dir", d);
    }
    if (p > 1) params.set("page", String(p));
    const str = params.toString();
    return str ? `/admin/participants?${str}` : "/admin/participants";
  };

  const toggleHref = (field: SortField) => {
    const d =
      field === sort
        ? dir === "asc"
          ? "desc"
          : "asc"
        : field === "stage"
          ? "asc"
          : "desc";
    return qs(1, field, d);
  };

  const headers: { key: SortField | null; label: string }[] = [
    { key: "nama", label: "Nama" },
    { key: "badanUsaha", label: "Badan Usaha" },
    { key: "stage", label: "Status" },
    { key: null, label: "Kegiatan" },
    { key: "createdAt", label: "Terdaftar" },
  ];

  return (
    <AdminShell title="Peserta" eyebrow="Semua kegiatan">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
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
              placeholder="Nama, badan usaha, email, atau no WA"
              className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>
        <p className="text-sm tabular-nums text-ink-secondary">
          {total} peserta
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          title={q ? "Tidak ada peserta yang cocok" : "Belum ada peserta terdaftar"}
          description={
            q
              ? "Coba kata kunci lain atau reset pencarian."
              : "Peserta mendaftar lewat link kegiatan yang kamu bagikan."
          }
          actionHref={q ? "/admin/participants" : undefined}
          actionLabel={q ? "Reset pencarian" : undefined}
        />
      ) : (
        <>
          <p className="text-sm tabular-nums text-ink-secondary">
            Menampilkan {start}–{end} dari {total}
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-hairline bg-surface px-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline-strong text-left">
                  {headers.map((h) =>
                    h.key ? (
                      <th
                        key={h.key}
                        className="py-3 pr-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary"
                      >
                        <Link
                          href={toggleHref(h.key)}
                          className="inline-flex items-center gap-1 hover:text-ink"
                        >
                          {h.label}
                          <span
                            aria-hidden
                            className={h.key === sort ? "" : "opacity-40"}
                          >
                            {h.key === sort
                              ? dir === "asc"
                                ? "▲"
                                : "▼"
                              : "↕"}
                          </span>
                        </Link>
                      </th>
                    ) : (
                      <th
                        key={h.label}
                        className="py-3 pr-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary"
                      >
                        {h.label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-hairline">
                    <td className="py-3 pr-6">
                      <p className="font-medium text-ink">{p.nama}</p>
                      <p className="text-[13px] text-ink-secondary">{p.email}</p>
                    </td>
                    <td className="py-3 pr-6 text-ink-secondary">{p.badanUsaha}</td>
                    <td className="py-3 pr-6">{STAGE_LABEL[p.stage]}</td>
                    <td className="py-3 pr-6">
                      <Link
                        href={`/admin/activities/${p.activity.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {p.activity.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-6 whitespace-nowrap tabular-nums text-ink-secondary">
                      {p.createdAt.toLocaleDateString("id-ID", {
                        dateStyle: "medium",
                      })}
                    </td>
                  </tr>
                ))}
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
                    href={qs(safePage - 1, sort, dir)}
                    className="inline-flex min-h-10 items-center rounded-md border border-hairline-strong bg-surface px-4 text-sm font-semibold hover:bg-canvas"
                  >
                    ← Sebelumnya
                  </Link>
                ) : null}
                {safePage < totalPages ? (
                  <Link
                    href={qs(safePage + 1, sort, dir)}
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
    </AdminShell>
  );
}
