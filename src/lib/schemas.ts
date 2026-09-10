import { z } from "zod";

export const moduleCreateSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
});

// Aturan field peserta — satu sumber kebenaran untuk form pendaftaran publik
// (/j/[activityId]) dan import Excel admin, supaya keduanya tidak bisa lagi
// berbeda aturan diam-diam.
export const participantFields = {
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  badanUsaha: z.string().min(3, "Nama badan usaha minimal 3 karakter"),
  npwp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((d) => d.length >= 15 && d.length <= 16, "NPWP harus 15 atau 16 digit"),
  wa: z.string().min(8, "No WA minimal 8 digit"),
  email: z.string().email("Email tidak valid"),
} as const;

export const moduleSettingsSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  shuffleQuestions: z.coerce.boolean().default(false),
  shuffleOptions: z.coerce.boolean().default(false),
  pretestDurationMin: z.coerce.number().int().min(1).max(480),
  posttestDurationMin: z.coerce.number().int().min(1).max(480),
  pretestPassingGrade: z.coerce.number().int().min(0).max(100),
  posttestPassingGrade: z.coerce.number().int().min(0).max(100),
  showAnswerReview: z.coerce.boolean().default(false),
});
