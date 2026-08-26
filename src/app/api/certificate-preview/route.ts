import { NextRequest, NextResponse } from "next/server";
import { renderCertificate, type CertificateFieldKey } from "@/lib/certificate-render";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const values = {
    number: sp.get("number") || "CERT-001",
    name: sp.get("name") || "Nama Peserta",
    company: sp.get("company") || "Nama Perusahaan",
    npwp: sp.get("npwp") || "NPWP Perusahaan",
    module: sp.get("module") || "Nama Modul",
  } as Record<CertificateFieldKey, string>;

  const buffer = await renderCertificate(values);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
