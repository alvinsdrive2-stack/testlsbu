import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { mkdir, rm } from "fs/promises";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 200 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
};

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
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "File harus berupa video" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Ukuran video maksimal 200 MB" },
      { status: 400 }
    );
  }

  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Format video ${file.type} tidak didukung` },
      { status: 400 }
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(dir, { recursive: true });

  const name = `${randomUUID()}.${ext}`;
  const filePath = path.join(dir, name);

  try {
    await pipeline(
      Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(filePath)
    );
  } catch {
    await rm(filePath, { force: true }).catch(() => {});
    return NextResponse.json(
      { error: "Gagal menyimpan video, coba lagi" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: `/uploads/videos/${name}` });
}
