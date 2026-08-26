import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getCertificateFields, saveCertificateFields } from "@/lib/certificate-config-server";
import { validateCertificateFields } from "@/lib/certificate-fields";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("gapensi_admin")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET)
    );
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  return NextResponse.json({ fields: await getCertificateFields() });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const fields = validateCertificateFields(body?.fields);
  if (!fields) {
    return NextResponse.json({ error: "Format konfigurasi tidak valid" }, { status: 400 });
  }
  await saveCertificateFields(fields);
  return NextResponse.json({ fields });
}
