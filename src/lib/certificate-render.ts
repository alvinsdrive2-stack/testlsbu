import path from "path";
import { createCanvas, loadImage, registerFont, type Canvas } from "canvas";
import {
  CERTIFICATE_FIELDS,
  type CertificateFieldConfig,
  type CertificateFieldKey,
} from "./certificate-fields";

export { CERTIFICATE_FIELDS } from "./certificate-fields";
export type { CertificateFieldConfig, CertificateFieldKey } from "./certificate-fields";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "template", "template1.png");

let fontsRegistered = false;

function ensureFonts() {
  if (fontsRegistered) return;
  registerFont(path.join(process.cwd(), "public", "fonts", "Poppins-Regular.ttf"), { family: "Poppins", weight: "normal" });
  registerFont(path.join(process.cwd(), "public", "fonts", "Poppins-Light.ttf"), { family: "Poppins", weight: "300" });
  fontsRegistered = true;
}

export function drawCertificate(
  canvas: Canvas,
  values: Record<CertificateFieldKey, string>,
  fields: CertificateFieldConfig[] = CERTIFICATE_FIELDS
) {
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "middle";

  for (const field of fields) {
    ctx.font = `${field.fontWeight === "300" ? "300 " : ""}${field.fontSize / 10}px "Poppins"`;
    ctx.fillStyle = field.color;
    ctx.textAlign = field.align === "middle" ? "center" : field.align;
    const x = field.align === "middle" ? canvas.width / 2 : field.x;
    ctx.fillText(values[field.key] ?? "", x, field.y);
  }
}

export async function renderCertificate(
  values: Record<CertificateFieldKey, string>,
  fields: CertificateFieldConfig[] = CERTIFICATE_FIELDS
): Promise<Buffer> {
  ensureFonts();
  const template = await loadImage(TEMPLATE_PATH);
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0);
  drawCertificate(canvas, values, fields);
  return canvas.toBuffer("image/png");
}
