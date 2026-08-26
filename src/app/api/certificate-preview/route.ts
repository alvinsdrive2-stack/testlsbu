import { NextRequest, NextResponse } from "next/server";
import { getCertificateFields } from "@/lib/certificate-config-server";
import { validateCertificateFields, type CertificateFieldKey } from "@/lib/certificate-fields";
import { renderCertificate } from "@/lib/certificate-render";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const values = {
    number: sp.get("number") || "CERT-001",
    name: sp.get("name") || "Nama Peserta",
    company: sp.get("company") || "Nama Perusahaan",
    npwp: sp.get("npwp") || "NPWP Perusahaan",
    module: sp.get("module") || "Nama Modul",
  } as Record<CertificateFieldKey, string>;

  let fields;
  const configParam = sp.get("config");
  if (configParam) {
    try {
      fields =
        validateCertificateFields(JSON.parse(decodeURIComponent(configParam))) ??
        (await getCertificateFields());
    } catch {
      fields = await getCertificateFields();
    }
  } else {
    fields = await getCertificateFields();
  }

  const buffer = await renderCertificate(values, fields);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
