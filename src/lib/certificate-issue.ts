import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateCertificateNumber } from "@/lib/certificate";

/** Deret nomor urut [last-count+1 .. last]. Dipisah supaya bisa diuji tanpa DB. */
export function sequenceRange(lastSequence: number, count: number): number[] {
  if (count <= 0 || lastSequence < count) return [];
  const start = lastSequence - count + 1;
  return Array.from({ length: count }, (_, i) => start + i);
}

/**
 * Samakan `certificate.moduleTitle` dengan judul modul yang berlaku sekarang.
 *
 * moduleTitle di baris certificate itu SALINAN saat terbit — jadi rename modul
 * tidak otomatis kebawa. Dipanggil setelah modul / kegiatan diubah supaya
 * sertifikat yang di-download ULANG ikut nama terbaru.
 *
 * Nomor sertifikat tidak ikut berubah (nomor urut terbitan tetap), yang
 * diperbarui cuma judul modulnya.
 */
export async function syncCertificateModuleTitleByModule(
  moduleId: string,
  moduleTitle: string,
  tx: Prisma.TransactionClient = prisma
): Promise<number> {
  const { count } = await tx.certificate.updateMany({
    where: { participant: { activity: { moduleId } } },
    data: { moduleTitle },
  });
  return count;
}

/** Varian untuk satu kegiatan — dipakai saat judul KEGIATAN diubah. */
export async function syncCertificateModuleTitleByActivity(
  activityId: string,
  tx: Prisma.TransactionClient = prisma
): Promise<number> {
  const activity = await tx.activity.findUnique({
    where: { id: activityId },
    select: { module: { select: { title: true } } },
  });
  if (!activity) return 0;

  const { count } = await tx.certificate.updateMany({
    where: { participant: { activityId } },
    data: { moduleTitle: activity.module.title },
  });
  return count;
}

/**
 * Terbitkan sertifikat untuk banyak peserta sekaligus dalam SATU transaksi:
 * blok nomor urut dipesan sekali (bukan satu-satu), lalu tiap peserta
 * diberi nomor berurutan.
 *
 * Semua yang tercetak di sertifikat (nama, perusahaan, NPWP, modul, tanggal
 * ujian) DISALIN dari kondisi user/activity saat ini ke baris `certificate`.
 * Render sertifikat nanti membaca salinan itu, bukan `user`/`activity` lagi —
 * jadi mengedit profil peserta atau jadwal kegiatan tidak mengubah sertifikat
 * yang sudah di tangan peserta.
 *
 * stage ikut di-set POSTTEST_PASSED — jalur penerbitan satuan hanya
 * memanggil ini setelah cek lulus, jalur massal memanggil ini untuk semua.
 */
export async function issueCertificates(participantIds: string[]): Promise<number> {
  if (participantIds.length === 0) return 0;

  const year = new Date().getFullYear();
  const counterId = `cert-seq-${year}`;

  return prisma.$transaction(
    async (tx) => {
      // Disaring dulu supaya jatah nomor tidak terbuang untuk peserta yang
      // ternyata sudah punya sertifikat.
      const pending = await tx.participant.findMany({
        where: { id: { in: participantIds }, certificate: null },
        select: {
          id: true,
          user: { select: { nama: true, badanUsaha: true, npwp: true } },
          activity: {
            select: {
              posttestStart: true,
              module: { select: { title: true } },
            },
          },
        },
      });
      const count = pending.length;
      if (count === 0) return 0;

      const issuedThisYear = await tx.certificate.count({
        where: {
          issuedAt: {
            gte: new Date(`${year}-01-01T00:00:00`),
            lt: new Date(`${year + 1}-01-01T00:00:00`),
          },
        },
      });

      // Counter per tahun di certificate_config — naik sekali sebanyak N,
      // atomik, jadi dua admin yang klik bersamaan tidak bisa dapat nomor sama.
      await tx.$executeRaw`
        INSERT INTO certificate_config (id, fields, updatedAt)
        VALUES (${counterId}, JSON_OBJECT('seq', ${issuedThisYear + count}), NOW())
        ON DUPLICATE KEY UPDATE
          fields = JSON_SET(fields, '$.seq', JSON_EXTRACT(fields, '$.seq') + ${count}),
          updatedAt = NOW()`;

      const rows = await tx.$queryRaw<{ seq: number | bigint }[]>`
        SELECT JSON_EXTRACT(fields, '$.seq') AS seq
        FROM certificate_config WHERE id = ${counterId}`;
      const numbers = sequenceRange(Number(rows[0].seq), count);

      const now = new Date();
      let issued = 0;
      for (let i = 0; i < count; i++) {
        const p = pending[i];
        await tx.certificate.create({
          data: {
            participantId: p.id,
            number: generateCertificateNumber(numbers[i]),
            name: p.user.nama,
            company: p.user.badanUsaha,
            npwp: p.user.npwp,
            moduleTitle: p.activity.module.title,
            examDate: p.activity.posttestStart,
            issuedAt: now,
          },
        });
        await tx.participant.update({
          where: { id: p.id },
          data: { stage: "POSTTEST_PASSED" },
        });
        issued++;
      }
      return issued;
    },
    // Massal bisa ratusan update dalam satu transaksi — kasih ruang waktu.
    { timeout: 30_000, maxWait: 10_000 }
  );
}
