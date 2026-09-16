"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseParticipantRows, type ImportRowError } from "@/lib/participant-import";
import { dedupeByEmail } from "@/lib/enrollment";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // samakan dengan serverActions.bodySizeLimit

export type ImportState = {
  error?: string;
  ok?: boolean;
  inserted?: number;
  failedRows?: number;
  /** Jumlah baris yang emailnya sudah ada di kegiatan ini — tidak diblokir,
   *  hanya dilaporkan supaya admin sadar kalau file ter-upload dua kali. */
  duplicateInActivity?: number;
  /** Identitas baru yang dibuat dari file ini. */
  newUsers?: number;
  /** Peserta yang sudah punya akun (dari kegiatan lain) — datanya dipakai
   *  ulang, tidak ditimpa file Excel. */
  reusedUsers?: number;
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

  // Email adalah kunci identitas, jadi satu email yang muncul dua kali di
  // file harus berakhir jadi satu user — bukan dua baris participant.
  const rows = dedupeByEmail(parse.rows);
  const emails = rows.map((r) => r.email);

  // Dihitung SEBELUM insert, jadi angkanya benar-benar berarti "sudah ada di
  // kegiatan ini dari sebelumnya" (penanda file ter-upload dua kali).
  const alreadyEnrolled = await prisma.participant.count({
    where: { activityId, user: { email: { in: emails } } },
  });

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const userIdByEmail = new Map(existingUsers.map((u) => [u.email, u.id]));
  const newUsers = rows.filter((r) => !userIdByEmail.has(r.email));

  const inserted = await prisma.$transaction(async (tx) => {
    if (newUsers.length > 0) {
      // User yang sudah ada TIDAK ditimpa: data yang diisi sendiri oleh
      // peserta lewat form pendaftaran lebih dipercaya daripada Excel admin.
      await tx.user.createMany({
        data: newUsers.map((r) => ({
          email: r.email,
          nama: r.nama,
          badanUsaha: r.badanUsaha,
          npwp: r.npwp,
          wa: r.wa,
          isGapensiMember: false,
        })),
      });
      const created = await tx.user.findMany({
        where: { email: { in: newUsers.map((r) => r.email) } },
        select: { id: true, email: true },
      });
      for (const u of created) userIdByEmail.set(u.email, u.id);
    }

    // skipDuplicates: orang yang sudah terdaftar di kegiatan ini dilewati,
    // tidak bikin pendaftaran kedua (unique activityId + userId).
    return tx.participant.createMany({
      data: rows.map((r) => ({
        activityId,
        userId: userIdByEmail.get(r.email)!,
      })),
      skipDuplicates: true,
    });
  });

  revalidatePath(`/admin/activities/${activityId}`);

  return {
    ok: true,
    inserted: inserted.count,
    failedRows: parse.errors.length,
    duplicateInActivity: alreadyEnrolled,
    newUsers: newUsers.length,
    reusedUsers: rows.length - newUsers.length,
    errors: parse.errors,
  };
}
