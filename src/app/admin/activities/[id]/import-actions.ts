"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseParticipantRows, type ImportRowError } from "@/lib/participant-import";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // samakan dengan serverActions.bodySizeLimit

export type ImportState = {
  error?: string;
  ok?: boolean;
  inserted?: number;
  failedRows?: number;
  /** Jumlah baris yang emailnya sudah ada di kegiatan ini — tidak diblokir,
   *  hanya dilaporkan supaya admin sadar kalau file ter-upload dua kali. */
  duplicateInActivity?: number;
  errors?: ImportRowError[];
};

function readSheetMatrix(sheet: {
  eachRow: (opts: { includeEmpty: boolean }, cb: (row: {
    eachCell: (opts: { includeEmpty: boolean }, cb: (cell: { text: string; value: unknown }) => void) => void;
  }) => void) => void;
}): unknown[][] {
  const matrix: unknown[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const values: unknown[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      // cell.text = teks terformat (menangani hyperlink/rich text);
      // kalau kosong jatuh ke value mentah.
      values.push(cell.text.trim() !== "" ? cell.text : cell.value);
    });
    matrix.push(values);
  });
  return matrix;
}

export async function importParticipants(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const activityId = String(formData.get("activityId"));

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true },
  });
  if (!activity) return { error: "Kegiatan tidak ditemukan." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Pilih file Excel (.xlsx) dulu." };
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    return { error: "File harus berekstensi .xlsx." };
  if (file.size > MAX_FILE_BYTES)
    return { error: "File terlalu besar (maks 4MB)." };

  let parse;
  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    // Deklarasi type exceljs masih pakai Buffer lama padahal runtime menerima
    // Buffer modern — cast ke tipe parameter load langsung.
    await workbook.xlsx.load(
      Buffer.from(await file.arrayBuffer()) as unknown as Parameters<
        typeof workbook.xlsx.load
      >[0]
    );

    const sheet = workbook.worksheets[0];
    if (!sheet) return { error: "File Excel tidak punya sheet." };

    parse = parseParticipantRows(readSheetMatrix(sheet));
  } catch {
    return { error: "File tidak bisa dibaca. Pastikan file .xlsx yang valid." };
  }

  if (!parse.ok)
    return {
      error: `Kolom wajib tidak ditemukan: ${parse.missingColumns.join(", ")}. Unduh template untuk melihat format yang benar.`,
    };

  if (parse.rows.length === 0)
    return {
      error: "Tidak ada baris yang valid untuk diimport.",
      errors: parse.errors,
    };

  const inserted = await prisma.participant.createMany({
    data: parse.rows.map((r) => ({
      activityId,
      nama: r.nama,
      badanUsaha: r.badanUsaha,
      npwp: r.npwp,
      wa: r.wa,
      email: r.email,
      isGapensiMember: false,
    })),
  });

  // Deteksi duplikat di kegiatan ini HANYA untuk laporan — tidak memblokir.
  const existing = await prisma.participant.findMany({
    where: { activityId, email: { in: parse.rows.map((r) => r.email) } },
    select: { email: true },
  });
  const uniqueImported = new Set(parse.rows.map((r) => r.email));
  const uniqueExisting = new Set(existing.map((e) => e.email));
  const duplicateInActivity = [...uniqueImported].filter((e) =>
    uniqueExisting.has(e)
  ).length;

  revalidatePath(`/admin/activities/${activityId}`);

  return {
    ok: true,
    inserted: inserted.count,
    failedRows: parse.errors.length,
    duplicateInActivity,
    errors: parse.errors,
  };
}
