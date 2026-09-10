import { prisma } from "@/lib/prisma";
import { generateCertificateNumber } from "@/lib/certificate";

/** Deret nomor urut [last-count+1 .. last]. Dipisah supaya bisa diuji tanpa DB. */
export function sequenceRange(lastSequence: number, count: number): number[] {
  if (count <= 0 || lastSequence < count) return [];
  const start = lastSequence - count + 1;
  return Array.from({ length: count }, (_, i) => start + i);
}

/**
 * Terbitkan sertifikat untuk banyak peserta sekaligus dalam SATU transaksi:
 * blok nomor urut dipesan sekali (bukan satu-satu), lalu tiap peserta
 * diberi nomor berurutan. Peserta yang ternyata sudah punya sertifikat
 * dilewati (nomornya jadi bolong, tapi tidak pernah dobel — kolom
 * certificateNumber unik).
 *
 * stage ikut di-set POSTTEST_PASSED — jalur penerbitan satuan hanya
 * memanggil ini setelah cek lulus, jalur massal memanggil ini untuk semua.
 */
export async function issueCertificates(participantIds: string[]): Promise<number> {
  const count = participantIds.length;
  if (count === 0) return 0;

  const year = new Date().getFullYear();
  const counterId = `cert-seq-${year}`;

  return prisma.$transaction(
    async (tx) => {
      const issuedThisYear = await tx.participant.count({
        where: {
          certificateNumber: { not: null },
          certificateIssuedAt: {
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
        const res = await tx.participant.updateMany({
          where: { id: participantIds[i], certificateNumber: null },
          data: {
            certificateNumber: generateCertificateNumber(numbers[i]),
            certificateIssuedAt: now,
            stage: "POSTTEST_PASSED",
          },
        });
        issued += res.count;
      }
      return issued;
    },
    // Massal bisa ratusan update dalam satu transaksi — kasih ruang waktu.
    { timeout: 30_000, maxWait: 10_000 }
  );
}
