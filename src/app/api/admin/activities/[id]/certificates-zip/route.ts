import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCertificateFields } from "@/lib/certificate-config-server";
import { renderCertificate, type CertificateFieldKey } from "@/lib/certificate-render";
import { formatNpwp } from "@/lib/format";
import JSZip from "jszip";

// Sanitasi nama folder/file biar aman dari karakter ilegal di path ZIP.
function sanitizeFilename(s: string) {
  return s.replace(/[\\/:*?"<>|]/g, "_").trim();
}

// Konstanta kompresi — hasil benchmark:
//  - toBuffer compressionLevel 3  >>> level 0: ukuran 11.3MB -> 0.35MB per PNG
//    (waktu encode nyaris sama ~90ms; level 6 cuma hemat 0.04MB lagi tapi 40% lebih lambat)
//  - ZIP DEFLATE level 3          >>> STORE: nggak nimbun PNG mentah 11MB-an di respon
// Render dieksekusi serial (bukan Promise.all) — cuma SATU canvas 11MB yang hidup
// dalam satu waktu, bukan puluhan/ ratusan sekaligus. Memory stabil, 137/OOM ilang.
const PNG_COMPRESSION = 3;
const ZIP_COMPRESSION = 3;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: activityId } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, title: true },
  });
  if (!activity) {
    return new Response("Kegiatan tidak ditemukan", { status: 404 });
  }

  const participants = await prisma.participant.findMany({
    where: { activityId, certificate: { isNot: null } },
    select: {
      certificate: {
        select: {
          number: true,
          name: true,
          company: true,
          npwp: true,
          moduleTitle: true,
          examDate: true,
        },
      },
    },
  });

  if (participants.length === 0) {
    return new Response("Belum ada sertifikat untuk kegiatan ini", {
      status: 404,
    });
  }

  const fields = await getCertificateFields();
  const zip = new JSZip();
  const activityFolder = sanitizeFilename(activity.title);

  // Render serial — satu canvas aktif per iterasi. Buffer PNG (~0.35MB) masuk
  // ke JSZip, bukan ditimbun di array.
  for (const p of participants) {
    const cert = p.certificate!;
    const examDate = cert.examDate
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(cert.examDate)
      : "";

    const values = {
      number: cert.number,
      name: cert.name,
      company: cert.company,
      npwp: formatNpwp(cert.npwp),
      module: cert.moduleTitle,
      date: examDate,
    } as Record<CertificateFieldKey, string>;

    // Kompresi PNG di canvas (level 3): 11.3MB mentah -> ~0.35MB.
    const buffer = await renderCertificate(values, fields, PNG_COMPRESSION);
    const filename = `${sanitizeFilename(cert.number)} - ${sanitizeFilename(cert.name)}.png`;
    // Struktur: <nama kegiatan>/<idkta> - <NAMA>.png
    zip.file(`${activityFolder}/${filename}`, buffer, {
      compression: "DEFLATE",
      compressionOptions: { level: ZIP_COMPRESSION },
    });
  }

  // Zip di-generate penuh dulu, tapi sekarang udah KECIL: PNG tiap peserta
  // cuma ~0.35MB (level 3), bukan 11MB mentah. 100 peserta = ~36MB, bukan 1.1GB.
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: ZIP_COMPRESSION },
  });

  const filename = `sertifikat-${activityFolder}.zip`;

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}