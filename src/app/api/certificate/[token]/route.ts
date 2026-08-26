import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderCertificate, type CertificateFieldKey } from "@/lib/certificate-render";

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

  const values = {
    number: participant.certificateNumber,
    name: participant.nama,
    company: participant.badanUsaha,
    npwp: participant.npwp,
    module: participant.activity.module.title,
  } as Record<CertificateFieldKey, string>;

  const buffer = await renderCertificate(values);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": `attachment; filename="sertifikat-${participant.certificateNumber}.png"`,
    },
  });
}
