import path from "path";
import { createCanvas, loadImage, registerFont, type Canvas, type Image } from "canvas";
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
  registerFont(path.join(process.cwd(), "public", "fonts", "Poppins-Bold.ttf"), { family: "Poppins", weight: "bold" });
  fontsRegistered = true;
}

// Template di-cache sekali — render massal (ZIP semua sertifikat) nggak perlu
// baca + decode PNG dari disk tiap sertifikat. Promise aman dipakai ke
// banyak canvas sekaligus karena loadImage sifatnya idempotent.
let templatePromise: Promise<Image> | null = null;

function loadTemplate() {
  if (!templatePromise) {
    templatePromise = loadImage(TEMPLATE_PATH);
    templatePromise.catch(() => { templatePromise = null; });
  }
  return templatePromise;
}

export function drawCertificate(
  canvas: Canvas,
  values: Record<CertificateFieldKey, string>,
  fields: CertificateFieldConfig[] = CERTIFICATE_FIELDS
) {
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "middle";

  for (const field of fields) {
    const weight =
      field.fontWeight === "300"
        ? "300 "
        : field.fontWeight === "bold" || field.fontWeight === "700"
        ? "bold "
        : "";
    ctx.font = `${weight}${field.fontSize / 10}px "${field.fontFamily || "Poppins"}"`;
    ctx.fillStyle = field.color;
    ctx.textAlign = field.align === "middle" ? "center" : field.align;
    const x = field.align === "middle" ? canvas.width / 2 : field.x;
    const text =
      field.key === "number"
        ? `No. ${values[field.key] ?? ""}`
        : field.key === "npwp"
          ? `NPWP BUJK: ${values[field.key] ?? ""}`
          : values[field.key] ?? "";
    ctx.fillText(text, x, field.y);
  }
}

type PngCompression = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export async function renderCertificate(
  values: Record<CertificateFieldKey, string>,
  fields: CertificateFieldConfig[] = CERTIFICATE_FIELDS,
  compressionLevel: PngCompression = 6
): Promise<Buffer> {
  ensureFonts();
  const template = await loadTemplate();
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0);
  drawCertificate(canvas, values, fields);
  // compressionLevel 0 pernah dipakai buat "skip re-encode", tapi itu keliru:
  // output pnglib level 0 = PNG mentah 11MB, bukan terkompresi. Render massal
  // (ZIP) override ke 3 — ukuran 0.35MB, waktu encode nyaris setara level 0.
  return canvas.toBuffer("image/png", { compressionLevel });
}
