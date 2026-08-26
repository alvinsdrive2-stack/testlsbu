export type CertificateFieldKey = "number" | "name" | "company" | "npwp" | "module";

export type CertificateFieldConfig = {
  key: CertificateFieldKey;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align: "start" | "middle" | "end";
  fontWeight: string;
  fontFamily: string;
};

export const CERTIFICATE_FIELDS: CertificateFieldConfig[] = [
  { key: "number",   label: "Nomor Sertifikat", x: 600, y: 176, fontSize: 180, color: "#108af4", align: "middle", fontWeight: "300",    fontFamily: "Poppins" },
  { key: "name",     label: "Nama",             x: 600, y: 309, fontSize: 600, color: "#012A4D", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
  { key: "company",  label: "Perusahaan",       x: 600, y: 237, fontSize: 400, color: "#012A4D", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
  { key: "npwp",     label: "NPWP",             x: 600, y: 274, fontSize: 199, color: "#012A4D", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
  { key: "module",   label: "Modul",            x: 600, y: 442, fontSize: 190, color: "#0d0d0d", align: "middle", fontWeight: "normal", fontFamily: "Poppins" },
];
