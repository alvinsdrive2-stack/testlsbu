import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import {
  buildGrowth,
  growthSince,
  toCountRows,
  type GrowthRange,
} from "@/lib/growth";

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
    prisma.$queryRaw<{ day: string; c: number | bigint }[]>`
      SELECT DATE_FORMAT(DATE_ADD(createdAt, INTERVAL 7 HOUR), '%Y-%m-%d') AS day, COUNT(*) AS c
      FROM activity WHERE createdAt >= ${since} GROUP BY day`,
    prisma.$queryRaw<{ day: string; c: number | bigint }[]>`
      SELECT DATE_FORMAT(DATE_ADD(createdAt, INTERVAL 7 HOUR), '%Y-%m-%d') AS day, COUNT(*) AS c
      FROM participant WHERE createdAt >= ${since} GROUP BY day`,
  ]);

  return NextResponse.json(
    buildGrowth(range, toCountRows(activities), toCountRows(participants))
  );
}
