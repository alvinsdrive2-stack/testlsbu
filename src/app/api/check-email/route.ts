import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ taken: false });
  }
  const existing = await prisma.participant.findFirst({
    where: { email },
    select: { id: true },
  });
  return NextResponse.json({ taken: existing !== null });
}
