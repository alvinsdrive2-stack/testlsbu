import { prisma } from "@/lib/prisma";
import {
  CERTIFICATE_FIELDS,
  parseStoredCertificateFields,
  type CertificateFieldConfig,
} from "./certificate-fields";

export async function getCertificateFields(): Promise<CertificateFieldConfig[]> {
  try {
    const row = await prisma.certificateConfig.findUnique({ where: { id: "default" } });
    if (row) {
      return parseStoredCertificateFields(row.fields);
    }
  } catch {
    // tabel belum ada / DB error — pakai default
  }
  return CERTIFICATE_FIELDS;
}

export async function saveCertificateFields(fields: CertificateFieldConfig[]): Promise<void> {
  await prisma.certificateConfig.upsert({
    where: { id: "default" },
    update: { fields },
    create: { id: "default", fields },
  });
}
