import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { createCanvas, loadImage, registerFont } from "canvas";

registerFont(path.join(process.cwd(), "public", "fonts", "Poppins-Regular.ttf"), { family: "Poppins", weight: "normal" });
registerFont(path.join(process.cwd(), "public", "fonts", "Poppins-Light.ttf"), { family: "Poppins", weight: "300" });

const certificateConfig = [
  { label: "Nomor Sertifikat", y: 176, fontSize: 180, color: "#108af4", align: "middle", fontWeight: "300" },
  { label: "Nama", y: 309, fontSize: 600, color: "#012A4D", align: "middle", fontWeight: "normal" },
  { label: "Perusahaan", y: 237, fontSize: 400, color: "#012A4D", align: "middle", fontWeight: "normal" },
  { label: "NPWP", y: 274, fontSize: 199, color: "#012A4D", align: "middle", fontWeight: "normal" },
  { label: "Modul", y: 442, fontSize: 190, color: "#0d0d0d", align: "middle", fontWeight: "normal" },
] as const;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const number = searchParams.get("number") || "CERT-001";
  const name = searchParams.get("name") || "Nama Peserta";
  const company = searchParams.get("company") || "Nama Perusahaan";
  const npwp = searchParams.get("npwp") || "NPWP Perusahaan";
  const moduleName = searchParams.get("module") || "Nama Modul";

  const templatePath = path.join(process.cwd(), "public", "template", "template1.png");

  const templateImage = await loadImage(templatePath);
  const canvas = createCanvas(templateImage.width, templateImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(templateImage, 0, 0);

  const centerX = canvas.width / 2;

  for (const config of certificateConfig) {
    let text = "";
    switch (config.label) {
      case "Nomor Sertifikat": text = number; break;
      case "Nama": text = name; break;
      case "Perusahaan": text = company; break;
      case "NPWP": text = npwp; break;
      case "Modul": text = moduleName; break;
    }

    ctx.font = `${config.fontSize / 10}px "Poppins"`;
    ctx.fillStyle = config.color;
    ctx.globalAlpha = 1;

    const finalX = config.align === "middle" ? centerX : config.align === "end" ? canvas.width - centerX : centerX;

    ctx.fillText(text, finalX, config.y);
  }

  const buffer = canvas.toBuffer("image/png");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
