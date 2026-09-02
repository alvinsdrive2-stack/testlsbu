// NPWP 15 digit: XX.XXX.XXX.X-XXX.XXX
// NPWP 16 digit (NIK terintegrasi): XX.XXX.XXX.X-XXX.XXXX
export function formatNpwp(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = raw.replace(/\D/g, "");
  if (d.length === 15)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}.${d.slice(8, 9)}-${d.slice(9, 12)}.${d.slice(12, 15)}`;
  if (d.length === 16)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}.${d.slice(8, 9)}-${d.slice(9, 12)}.${d.slice(12, 16)}`;
  return raw;
}

// Mask buat input register: format progresif selagi ngetik, maks 16 digit
// (NPWP 16 digit — NIK terintegrasi — grup terakhir jadi 4 digit).
export function maskNpwp(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 16);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "." + d.slice(2, 5);
  if (d.length > 5) out += "." + d.slice(5, 8);
  if (d.length > 8) out += "." + d.slice(8, 9);
  if (d.length > 9) out += "-" + d.slice(9, 12);
  if (d.length > 12) out += "." + d.slice(12, 15);
  if (d.length > 15) out += "." + d.slice(15, 16);
  return out;
}
