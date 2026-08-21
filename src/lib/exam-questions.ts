import { prisma } from "@/lib/prisma";

/**
 * Satu-satunya pintu query bank soal. Pretest dan posttest memakai bank
 * yang sama (section PRETEST). Semua konsumen — halaman ujian, penilaian,
 * review — wajib lewat sini supaya tidak bisa mismatch section.
 */
export function getExamQuestions(moduleId: string) {
  return prisma.question.findMany({
    where: { moduleId, section: "PRETEST" },
    include: { options: true },
    orderBy: { order: "asc" },
  });
}
