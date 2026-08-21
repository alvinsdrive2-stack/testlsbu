import { z } from "zod";

export const moduleCreateSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
});

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
