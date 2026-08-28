import { z } from "zod";

export type CertificateFieldKey = "number" | "name" | "company" | "npwp" | "module" | "date";

export type CertificateFieldConfig = {
  key: CertificateFieldKey;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align: "start" | "middle" | "end";
  fontWeight: string;
  fontFamily: string;
};

export const CERTIFICATE_FIELDS: CertificateFieldConfig[] = [
  { key: "number",   label: "Nomor Sertifikat", x: 988, y: 421,  fontSize: 380,  color: "#108af4", align: "middle", fontWeight: "300",    fontFamily: "Poppins" },
  { key: "name",     label: "Nama",             x: 969, y: 730,  fontSize: 1000, color: "#012A4D", align: "middle", fontWeight: "bold",   fontFamily: "Poppins" },
  { key: "company",  label: "Perusahaan",       x: 950, y: 560,  fontSize: 750,  color: "#012A4D", align: "middle", fontWeight: "bold",   fontFamily: "Poppins" },
  { key: "npwp",     label: "NPWP",             x: 962, y: 641,  fontSize: 450,  color: "#012A4D", align: "middle", fontWeight: "bold",   fontFamily: "Poppins" },
  { key: "module",   label: "Modul",            x: 986, y: 1044, fontSize: 415,  color: "#0d0d0d", align: "middle", fontWeight: "bold",   fontFamily: "Poppins" },
  { key: "date",     label: "Tanggal Uji",      x: 950, y: 950,  fontSize: 380,  color: "#0d0d0d", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
];

const fieldSchema = z.object({
  key: z.enum(["number", "name", "company", "npwp", "module", "date"]),
  label: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  fontSize: z.number().int().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  align: z.enum(["start", "middle", "end"]),
  fontWeight: z.string().min(1),
  fontFamily: z.string().min(1),
});

const fieldsSchema = z.array(fieldSchema).length(6).refine(
  (fields) => new Set(fields.map((f) => f.key)).size === 6,
  { message: "Key field sertifikat harus unik dan lengkap" }
);

// Config tersimpan bisa dari versi lama (belum punya field baru) —
// ambil yang valid, sisanya merge dari default sesuai urutan CERTIFICATE_FIELDS.
export function parseStoredCertificateFields(
  raw: unknown
): CertificateFieldConfig[] {
  const result = z.array(fieldSchema).safeParse(raw);
  const list = result.success ? result.data : [];
  const byKey = new Map(list.map((f) => [f.key, f] as const));
  return CERTIFICATE_FIELDS.map((d) => byKey.get(d.key) ?? d);
}

export function validateCertificateFields(raw: unknown): CertificateFieldConfig[] | null {
  const result = fieldsSchema.safeParse(raw);
  return result.success ? result.data : null;
}
