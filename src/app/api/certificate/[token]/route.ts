import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCertificateFields } from "@/lib/certificate-config-server";
import { renderCertificate, type CertificateFieldKey } from "@/lib/certificate-render";
import { formatNpwp } from "@/lib/format";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const participant = await prisma.participant.findUnique({
    where: { token },
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

  if (!participant?.certificate) {
    return NextResponse.json({ error: "Sertifikat tidak ditemukan" }, { status: 404 });
  }

  const cert = participant.certificate;
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

  const buffer = await renderCertificate(values, await getCertificateFields());

  const isDownload = req.nextUrl.searchParams.get("download") === "1";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": `${
        isDownload ? "attachment" : "inline"
      }; filename="sertifikat-${cert.number}.png"`,
    },
  });
}
