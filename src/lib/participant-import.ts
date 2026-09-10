import { z } from "zod";
import { participantFields } from "./schemas";

// Header template import — sama persis dengan baris header "Export Excel"
// (export/route.ts) supaya file hasil export bisa diedit lalu diimport ulang.
export const TEMPLATE_HEADERS = [
  "NO",
  "NAMA PESERTA",
  "NAMA PERUSAHAAN",
  "NPWP PERUSAHAAN",
  "TELEPON",
  "ALAMAT EMAIL PESERTA",
] as const;

export type ImportParticipant = {
  nama: string;
  badanUsaha: string;
  npwp: string;
  wa: string;
  email: string;
};

export type ImportRowError = { row: number; message: string };

export type ParseOutcome =
  | { ok: false; missingColumns: string[] }
  | {
      ok: true;
      totalRows: number;
      rows: ImportParticipant[];
      errors: ImportRowError[];
    };

type Field = keyof typeof participantFields;

// Header yang diterima per field — file hasil Export Excel dan file yang
// diisi manual sama-sama terbaca.
const HEADER_ALIASES: Record<Field, string[]> = {
  nama: ["NAMA PESERTA", "NAMA"],
  badanUsaha: ["NAMA PERUSAHAAN", "BADAN USAHA", "NAMA BADAN USAHA"],
  npwp: ["NPWP PERUSAHAAN", "NPWP"],
  wa: ["TELEPON", "NO TELEPON", "NO WA", "NO HP", "TELEPON/WA"],
  email: ["ALAMAT EMAIL PESERTA", "ALAMAT EMAIL", "EMAIL"],
};

const FIELD_LABEL: Record<Field, string> = {
  nama: "NAMA PESERTA",
  badanUsaha: "NAMA PERUSAHAAN",
  npwp: "NPWP PERUSAHAAN",
  wa: "TELEPON",
  email: "ALAMAT EMAIL PESERTA",
};

const importRowSchema = z.object(participantFields);

// Sel Excel bisa berupa string, number, formula, hyperlink, rich text.
// Semua direduksi jadi teks; angka besar (NPWP) sebaiknya diketik sebagai
// teks di Excel supaya presisinya tidak hilang duluan.
export function cellToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.text === "string") return v.text.trim();
    if (typeof v.result === "string" || typeof v.result === "number")
      return String(v.result).trim();
    if (Array.isArray(v.richText))
      return v.richText
        .map((r) => cellToText((r as Record<string, unknown>).text))
        .join("")
        .trim();
  }
  return String(value).trim();
}

function normalizeHeader(value: unknown): string {
  return cellToText(value).toUpperCase().replace(/\s+/g, " ").trim();
}

// Cari baris header — file hasil Export punya 3 baris judul + 1 baris kosong,
// jadi header bisa di baris ke-5; template kosong meletakkannya di baris ke-1.
function findHeaderRow(matrix: unknown[][]): number {
  const limit = Math.min(matrix.length, 20);
  for (let i = 0; i < limit; i++) {
    const header = (matrix[i] ?? []).map(normalizeHeader);
    const matched = (Object.keys(HEADER_ALIASES) as Field[]).filter((f) =>
      header.some((h) => HEADER_ALIASES[f].includes(h))
    );
    if (matched.length >= 4) return i;
  }
  return -1;
}

export function parseParticipantRows(matrix: unknown[][]): ParseOutcome {
  const headerIndex = findHeaderRow(matrix);
  if (headerIndex === -1) {
    return { ok: false, missingColumns: Object.values(FIELD_LABEL) };
  }

  const header = (matrix[headerIndex] ?? []).map(normalizeHeader);
  const columnOf = {} as Record<Field, number>;
  const missingColumns: string[] = [];
  for (const field of Object.keys(HEADER_ALIASES) as Field[]) {
    const idx = header.findIndex((h) => HEADER_ALIASES[field].includes(h));
    if (idx === -1) missingColumns.push(FIELD_LABEL[field]);
    else columnOf[field] = idx;
  }
  if (missingColumns.length > 0) return { ok: false, missingColumns };

  const rows: ImportParticipant[] = [];
  const errors: ImportRowError[] = [];
  let totalRows = 0;

  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const raw = matrix[i] ?? [];
    const candidate = {
      nama: cellToText(raw[columnOf.nama]),
      badanUsaha: cellToText(raw[columnOf.badanUsaha]),
      npwp: cellToText(raw[columnOf.npwp]),
      wa: cellToText(raw[columnOf.wa]),
      email: cellToText(raw[columnOf.email]).toLowerCase(),
    };
    if (Object.values(candidate).every((v) => v === "")) continue; // baris kosong
    totalRows++;

    const parsed = importRowSchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push({ row: i + 1, message: parsed.error.issues[0].message });
      continue;
    }
    rows.push(parsed.data);
  }

  return { ok: true, totalRows, rows, errors };
}
