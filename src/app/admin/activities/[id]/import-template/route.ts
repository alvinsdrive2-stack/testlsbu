import { NextRequest, NextResponse } from "next/server";
import { TEMPLATE_HEADERS } from "@/lib/participant-import";

// Template kosong untuk import peserta — header sama persis dengan file
// hasil Export Excel supaya admin tidak perlu menebak format.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Peserta");

  const headerRow = worksheet.getRow(1);
  headerRow.values = [...TEMPLATE_HEADERS];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF006400" },
  };

  // Kolom NPWP & TELEPON diformat teks dari awal — angka 15+ digit di Excel
  // kehilangan presisi kalau diketik sebagai number.
  worksheet.columns = [
    { width: 5 },
    { width: 32 },
    { width: 36 },
    { width: 22 },
    { width: 18 },
    { width: 30 },
  ];
  for (const col of ["D", "E"]) {
    worksheet.getColumn(col).numFmt = "@";
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="template-import-peserta-${id}.xlsx"`,
    },
  });
}
