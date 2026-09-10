import { describe, expect, it } from "vitest";
import {
  TEMPLATE_HEADERS,
  cellToText,
  parseParticipantRows,
} from "./participant-import";

const NPWP = "123456789012345"; // 15 digit, sintetis

function dataRow(no: number, nama = "Budi Santoso", bu = "PT Contoh Jaya") {
  return [no, nama, bu, NPWP, "081234567890", "budi@contoh.co.id"];
}

describe("findHeaderRow (via parseParticipantRows)", () => {
  it("menerima header di baris pertama (template)", () => {
    const result = parseParticipantRows([
      [...TEMPLATE_HEADERS],
      dataRow(1),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(1);
  });

  it("menerima header di baris ke-5 (format file hasil Export Excel)", () => {
    const result = parseParticipantRows([
      ["DAFTAR PESERTA KEGIATAN PUB"],
      ["Judul Modul"],
      ["Tanggal Kegiatan: 10 September 2026"],
      [],
      [...TEMPLATE_HEADERS],
      dataRow(1),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(1);
  });

  it("menolak file tanpa header yang dikenal", () => {
    const result = parseParticipantRows([["bukan header"], dataRow(1)]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missingColumns.length).toBeGreaterThan(0);
  });

  it("menolak kalau satu kolom wajib hilang", () => {
    const header = [...TEMPLATE_HEADERS].filter((h) => h !== "TELEPON");
    const result = parseParticipantRows([header, dataRow(1)]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missingColumns).toContain("TELEPON");
  });

  it("header tidak peduli huruf besar/kecil", () => {
    const result = parseParticipantRows([
      ["no", "Nama Peserta", "nama perusahaan", "npwp perusahaan", "telepon", "alamat email peserta"],
      dataRow(1),
    ]);
    expect(result.ok).toBe(true);
  });
});

describe("validasi baris", () => {
  it("baris valid lolos dan email di-lowercase", () => {
    const result = parseParticipantRows([
      [...TEMPLATE_HEADERS],
      [1, "Budi Santoso", "PT Contoh Jaya", NPWP, "081234567890", "BUDI@CONTOH.CO.ID"],
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0].email).toBe("budi@contoh.co.id");
      expect(result.totalRows).toBe(1);
      expect(result.errors).toHaveLength(0);
    }
  });

  it("NPWP berformat titik dibaca sebagai digit", () => {
    const result = parseParticipantRows([
      [...TEMPLATE_HEADERS],
      [1, "Budi Santoso", "PT Contoh Jaya", "12.345.678.9-012.345", "081234567890", "budi@contoh.co.id"],
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows[0].npwp).toBe(NPWP);
  });

  it("NPWP kurang dari 15 digit jadi error baris, baris lain tetap masuk", () => {
    const result = parseParticipantRows([
      [...TEMPLATE_HEADERS],
      dataRow(1),
      [2, "Ani Lestari", "CV Mitra Abadi", "123", "081234567890", "ani@contoh.co.id"],
      dataRow(3),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      expect(result.errors).toEqual([
        { row: 3, message: "NPWP harus 15 atau 16 digit" },
      ]);
    }
  });

  it("email tidak valid jadi error baris", () => {
    const result = parseParticipantRows([
      [...TEMPLATE_HEADERS],
      [1, "Budi Santoso", "PT Contoh Jaya", NPWP, "081234567890", "budi-atas"],
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.errors[0].message).toBe("Email tidak valid");
  });

  it("telepon '-' (nilai kosong dari export lama) jadi error baris", () => {
    const result = parseParticipantRows([
      [...TEMPLATE_HEADERS],
      [1, "Budi Santoso", "PT Contoh Jaya", NPWP, "-", "budi@contoh.co.id"],
    ]);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.errors[0].message).toBe("No WA minimal 8 digit");
  });

  it("nama terlalu pendek jadi error baris", () => {
    const result = parseParticipantRows([
      [...TEMPLATE_HEADERS],
      [1, "Ab", "PT Contoh Jaya", NPWP, "081234567890", "budi@contoh.co.id"],
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.errors[0].message).toBe("Nama minimal 3 karakter");
  });

  it("baris kosong diabaikan", () => {
    const result = parseParticipantRows([
      [...TEMPLATE_HEADERS],
      dataRow(1),
      [],
      ["", "", "", "", "", ""],
      dataRow(2),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);
    }
  });
});

describe("cellToText", () => {
  it("sel hyperlink dibaca sebagai teksnya", () => {
    expect(cellToText({ text: "budi@contoh.co.id", hyperlink: "mailto:x" })).toBe(
      "budi@contoh.co.id"
    );
  });

  it("sel angka jadi string", () => {
    expect(cellToText(8)).toBe("8");
    expect(cellToText(null)).toBe("");
  });
});
