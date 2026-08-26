import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { mkdir, rm } from "fs/promises";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import path from "path";
import { randomUUID } from "crypto";
import { PDF_MAX_SIZE, PDF_SIZE_LABEL } from "@/lib/upload";

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

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak terkirim. Pilih file PDF dulu." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "File harus berupa PDF (.pdf)." }, { status: 400 });
  }
  if (file.size > PDF_MAX_SIZE) {
    return NextResponse.json(
      { error: `Ukuran PDF terlalu besar. Maksimal ${PDF_SIZE_LABEL}.` },
      { status: 400 }
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "pdfs");
  await mkdir(dir, { recursive: true });

  const name = `${randomUUID()}.pdf`;
  const filePath = path.join(dir, name);

  try {
    await pipeline(
      Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(filePath)
    );
  } catch {
    await rm(filePath, { force: true }).catch(() => {});
    return NextResponse.json(
      { error: "Gagal menyimpan PDF di server. Coba lagi, atau cek izin folder upload." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: `/uploads/pdfs/${name}` });
}
