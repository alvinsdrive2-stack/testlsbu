import { describe, expect, it } from "vitest";
import { dedupeByEmail, pickDefaultEnrollment, scheduleAnchor } from "../enrollment";

const NOW = new Date("2026-09-16T10:00:00Z");
const H = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000);

/** Kegiatan satu hari penuh: daftar → pretest → materi → posttest → tutup. */
const hari = (mulaiJam: number, tutupJam: number) => ({
  registrationStart: H(mulaiJam),
  pretestStart: H(mulaiJam + 1),
  materialStart: H(mulaiJam + 2),
  posttestStart: H(mulaiJam + 3),
  closedAt: H(tutupJam),
});

describe("scheduleAnchor", () => {
  it("ambil jadwal sesi paling akhir, closedAt diabaikan", () => {
    expect(
      scheduleAnchor({
        registrationStart: H(-10),
        pretestStart: H(-9),
        closedAt: H(50),
      })
    ).toBe(H(-9).getTime());
  });

  it("tanpa jadwal sama sekali -> 0", () => {
    expect(scheduleAnchor({})).toBe(0);
  });
});

describe("pickDefaultEnrollment", () => {
  it("tanpa pendaftaran -> null", () => {
    expect(pickDefaultEnrollment([], NOW)).toBeNull();
  });

  it("satu pendaftaran langsung dipakai", () => {
    const a = { id: "a", activity: hari(-6, 8) };
    expect(pickDefaultEnrollment([a], NOW)).toBe(a);
  });

  it("kegiatan yang sudah ditutup kalah dari yang sedang berjalan", () => {
    const kemarin = { id: "kemarin", activity: hari(-30, -20) };
    const hariIni = { id: "hari-ini", activity: hari(-6, 8) };
    expect(pickDefaultEnrollment([kemarin, hariIni], NOW)).toBe(hariIni);
  });

  it("kegiatan yang sedang berjalan menang atas yang belum mulai", () => {
    const hariIni = { id: "hari-ini", activity: hari(-6, 8) };
    const besok = { id: "besok", activity: hari(24, 40) };
    expect(pickDefaultEnrollment([besok, hariIni], NOW)).toBe(hariIni);
  });

  it("dua kegiatan berjalan -> ambil yang paling baru", () => {
    const pagi = { id: "pagi", activity: hari(-20, 8) };
    const siang = { id: "siang", activity: hari(-2, 8) };
    expect(pickDefaultEnrollment([pagi, siang], NOW)).toBe(siang);
  });

  it("semua belum mulai -> ambil yang paling cepat dibuka", () => {
    const jauh = { id: "jauh", activity: hari(30, 40) };
    const dekat = { id: "dekat", activity: hari(4, 10) };
    expect(pickDefaultEnrollment([jauh, dekat], NOW)).toBe(dekat);
  });

  it("semua sudah ditutup -> ambil yang paling baru", () => {
    const lama = { id: "lama", activity: hari(-30, -25) };
    const baru = { id: "baru", activity: hari(-3, -1) };
    expect(pickDefaultEnrollment([lama, baru], NOW)).toBe(baru);
  });

  it("kegiatan tanpa jadwal tetap terpilih kalau sendirian", () => {
    const tanpaJadwal = { id: "kosong", activity: {} };
    expect(pickDefaultEnrollment([tanpaJadwal], NOW)).toBe(tanpaJadwal);
  });
});

describe("dedupeByEmail", () => {
  it("email kembar disisakan yang pertama, urutan tetap", () => {
    const rows = [
      { email: "a@contoh.co.id", nama: "A" },
      { email: "b@contoh.co.id", nama: "B" },
      { email: "a@contoh.co.id", nama: "A lagi" },
    ];
    expect(dedupeByEmail(rows)).toEqual([
      { email: "a@contoh.co.id", nama: "A" },
      { email: "b@contoh.co.id", nama: "B" },
    ]);
  });

  it("beda huruf besar/kecil dan spasi di ujung dianggap email yang sama", () => {
    const rows = [{ email: "a@contoh.co.id" }, { email: " A@Contoh.co.id " }];
    expect(dedupeByEmail(rows)).toEqual([{ email: "a@contoh.co.id" }]);
  });

  it("email berbeda semua tidak ada yang dibuang", () => {
    const rows = [{ email: "a@contoh.co.id" }, { email: "b@contoh.co.id" }];
    expect(dedupeByEmail(rows)).toHaveLength(2);
  });
});
