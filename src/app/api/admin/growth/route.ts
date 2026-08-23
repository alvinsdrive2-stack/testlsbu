import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { buildGrowth, growthSince, type GrowthRange } from "@/lib/growth";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("gapensi_admin")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET)
    );
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const rangeParam = req.nextUrl.searchParams.get("range");
  const range: GrowthRange = ["week", "month", "year"].includes(rangeParam ?? "")
    ? (rangeParam as GrowthRange)
    : "week";

  const since = growthSince(range);
  const [activities, participants] = await Promise.all([
    prisma.activity.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.participant.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  return NextResponse.json(buildGrowth(range, activities, participants));
}
