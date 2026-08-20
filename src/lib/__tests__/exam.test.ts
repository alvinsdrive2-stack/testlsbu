import { describe, expect, it } from "vitest";
import { computeScore, deadlineFor, shuffleWithSeed } from "../exam";

describe("shuffleWithSeed", () => {
  it("deterministik: seed sama menghasilkan urutan sama", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffleWithSeed(items, 42)).toEqual(shuffleWithSeed(items, 42));
  });

  it("isi tetap sama walau urutan berubah", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = shuffleWithSeed(items, 123);
    expect(shuffled.slice().sort((a, b) => a - b)).toEqual(items);
  });

  it("seed beda umumnya menghasilkan urutan beda", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const different = shuffleWithSeed(items, 1).join(",") !== shuffleWithSeed(items, 2).join(",");
    expect(different).toBe(true);
  });

  it("array kosong dan satu elemen aman", () => {
    expect(shuffleWithSeed([], 7)).toEqual([]);
    expect(shuffleWithSeed([9], 7)).toEqual([9]);
  });
});

describe("computeScore", () => {
  it("pembulatan ke bawah: 2 dari 3 soal = 66", () => {
    expect(computeScore(3, 2)).toBe(66);
  });

  it("semua benar = 100", () => {
    expect(computeScore(5, 5)).toBe(100);
  });

  it("nol soal = 0 (hindari div by zero)", () => {
    expect(computeScore(0, 0)).toBe(0);
  });

  it("tanpa jawaban benar = 0", () => {
    expect(computeScore(4, 0)).toBe(0);
  });
});

describe("deadlineFor", () => {
  it("deadline = startedAt + durasi menit", () => {
    const started = new Date("2026-08-20T10:00:00Z");
    expect(deadlineFor(started, 30)).toEqual(new Date("2026-08-20T10:30:00Z"));
  });
});
