import { z } from "zod";

export type CertificateFieldKey = "number" | "name" | "company" | "npwp" | "module";

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
  { key: "number",   label: "Nomor Sertifikat", x: 600, y: 176, fontSize: 180, color: "#108af4", align: "middle", fontWeight: "300",    fontFamily: "Poppins" },
  { key: "name",     label: "Nama",             x: 600, y: 309, fontSize: 600, color: "#012A4D", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
  { key: "company",  label: "Perusahaan",       x: 600, y: 237, fontSize: 400, color: "#012A4D", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
  { key: "npwp",     label: "NPWP",             x: 600, y: 274, fontSize: 199, color: "#012A4D", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
  { key: "module",   label: "Modul",            x: 600, y: 442, fontSize: 190, color: "#0d0d0d", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
];

const fieldSchema = z.object({
  key: z.enum(["number", "name", "company", "npwp", "module"]),
  label: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  fontSize: z.number().int().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  align: z.enum(["start", "middle", "end"]),
  fontWeight: z.string().min(1),
  fontFamily: z.string().min(1),
});

const fieldsSchema = z.array(fieldSchema).length(5).refine(
  (fields) => new Set(fields.map((f) => f.key)).size === 5,
  { message: "Key field sertifikat harus unik dan lengkap" }
);

export function validateCertificateFields(raw: unknown): CertificateFieldConfig[] | null {
  const result = fieldsSchema.safeParse(raw);
  return result.success ? result.data : null;
}
