import { NextRequest, NextResponse } from "next/server";
import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import path from "path";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
};

const ALLOWED_TYPES = new Set(["pdfs", "videos"]);

function isSafeSegment(s: string): boolean {
  return (
    s.length > 0 &&
    s.length <= 255 &&
    s !== "." &&
    s !== ".." &&
    !s.includes("/") &&
    !s.includes("\\") &&
    !s.includes("\0")
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segs } = await params;
  if (!segs || segs.length < 2) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const [type, ...rest] = segs;
  if (!ALLOWED_TYPES.has(type) || !segs.every(isSafeSegment)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const fileName = rest.join(".");
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    type,
    fileName
  );

  let size: number;
  try {
    size = statSync(filePath).size;
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }

  const baseHeaders = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const range = req.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start >= size) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }
      const stream = Readable.toWeb(
        createReadStream(filePath, { start, end })
      ) as ReadableStream;
      return new NextResponse(stream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${size}`,
        },
      });
    }
  }

  const stream = Readable.toWeb(
    createReadStream(filePath)
  ) as ReadableStream;
  return new NextResponse(stream, {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(size) },
  });
}
