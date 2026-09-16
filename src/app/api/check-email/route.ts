import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailStatus =
  /** Email belum dipakai siapa pun — bebas. */
  | "ok"
  /** Email sudah punya akun, tapi belum terdaftar di kegiatan ini. */
  | "known"
  /** Email sudah terdaftar di kegiatan INI. */
  | "taken";

/**
 * Cek ketersediaan email untuk form pendaftaran. Email yang sudah dipakai di
 * kegiatan LAIN bukan masalah (peserta boleh ikut pelatihan di hari berbeda),
 * jadi hasilnya dibedakan `known` vs `taken` supaya form bisa menampilkan
 * peringatan tanpa memblokir submit.
 */
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") ?? "")
    .trim()
    .toLowerCase();
  const activityId = req.nextUrl.searchParams.get("activityId") ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ status: "ok" satisfies EmailStatus });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ status: "ok" satisfies EmailStatus });
  }

  if (!activityId) {
    return NextResponse.json({ status: "known" satisfies EmailStatus });
  }

  const enrolled = await prisma.participant.findUnique({
    where: { activityId_userId: { activityId, userId: user.id } },
    select: { id: true },
  });

  return NextResponse.json({
    status: (enrolled ? "taken" : "known") satisfies EmailStatus,
  });
}
