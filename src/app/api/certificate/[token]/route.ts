import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

registerFont(path.join(process.cwd(), "public", "fonts", "Poppins-Regular.ttf"), { family: "Poppins", weight: "normal" });
registerFont(path.join(process.cwd(), "public", "fonts", "Poppins-Light.ttf"), { family: "Poppins", weight: "300" });

const certificateConfig = [
  { label: "Nomor Sertifikat", y: 176, fontSize: 180, color: "#108af4", align: "middle", fontWeight: "300" },
  { label: "Nama", y: 309, fontSize: 600, color: "#012A4D", align: "middle", fontWeight: "normal" },
  { label: "Perusahaan", y: 237, fontSize: 400, color: "#012A4D", align: "middle", fontWeight: "normal" },
  { label: "NPWP", y: 274, fontSize: 199, color: "#012A4D", align: "middle", fontWeight: "normal" },
  { label: "Modul", y: 442, fontSize: 190, color: "#0d0d0d", align: "middle", fontWeight: "normal" },
] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: {
      activity: { include: { module: true } },
    },
  });

  if (!participant || !participant.certificateNumber) {
    return NextResponse.json({ error: "Sertifikat tidak ditemukan" }, { status: 404 });
  }

  const templatePath = path.join(process.cwd(), "public", "template", "template1.png");

  const templateImage = await loadImage(templatePath);
  const canvas = createCanvas(templateImage.width, templateImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(templateImage, 0, 0);

  const centerX = canvas.width / 2;

  for (const config of certificateConfig) {
    let text = "";
    switch (config.label) {
      case "Nomor Sertifikat": text = participant.certificateNumber!; break;
      case "Nama": text = participant.nama; break;
      case "Perusahaan": text = participant.badanUsaha; break;
      case "NPWP": text = participant.npwp; break;
      case "Modul": text = participant.activity.module.title; break;
    }

    ctx.font = `${config.fontWeight === "300" ? "300 " : ""}${config.fontSize / 10}px "Poppins"`;
    ctx.fillStyle = config.color;
    ctx.globalAlpha = 1;
    ctx.textAlign = config.align === "middle" ? "center" : config.align;
    ctx.textBaseline = "middle";

    ctx.fillText(text, centerX, config.y);
  }

  const buffer = canvas.toBuffer("image/png");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": `attachment; filename="sertifikat-${participant.certificateNumber}.png"`,
    },
  });
}
