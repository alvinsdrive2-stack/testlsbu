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

    const buffer = await renderCertificate(values, fields);
    const activityFolder = sanitizeFilename(activity.title);
    const filename = `${sanitizeFilename(cert.number)} - ${sanitizeFilename(cert.name)}.png`;
    // Struktur: KTA/<nama kegiatan>/<idkta> - <NAMA>.png
    zip.file(`KTA/${activityFolder}/${filename}`, buffer, { compression: "STORE" });
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const filename = `sertifikat-${activity.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip`;

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
