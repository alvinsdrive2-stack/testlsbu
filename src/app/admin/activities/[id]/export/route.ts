import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { module: true },
  });

  if (!activity) {
    return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });
  }

  const participants = await prisma.participant.findMany({
    where: { activityId: id },
    orderBy: { nama: "asc" },
    select: {
      nama: true,
      badanUsaha: true,
      npwp: true,
      wa: true,
      email: true,
    },
  });

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("4");

  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value = "DAFTAR PESERTA KEGIATAN PUB";
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.mergeCells("A2:F2");
  worksheet.getCell("A2").value = activity.module.title;
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A3:F3");
  worksheet.getCell("A3").value = `Tanggal Kegiatan: ${activity.closedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(activity.closedAt) : "-"}`;
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  worksheet.getRow(5).values = ["NO", "NAMA PESERTA", "NAMA PERUSAHAAN", "NPWP PERUSAHAAN", "TELEPON", "ALAMAT EMAIL PESERTA"];
  worksheet.getRow(5).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(5).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF006400" },
  };

  participants.forEach((p, i) => {
    worksheet.getRow(i + 6).values = [
      i + 1,
      p.nama,
      p.badanUsaha,
      p.npwp || "-",
      p.wa || "-",
      p.email,
    ];
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="daftar-peserta-${activity.id}.xlsx"`,
    },
  });
}
