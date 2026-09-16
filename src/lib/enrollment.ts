import { activityPhase, type ActivitySchedule } from "./activity-phase";

/** Bentuk minimal satu pendaftaran (participant + kegiatan induknya). */
export type EnrollmentLike = { activity: ActivitySchedule };

/**
 * Perkiraan "hari kegiatan": jadwal sesi paling akhir yang sudah diisi admin.
 * `closedAt` sengaja tidak ikut dihitung — itu batas penutupan, bukan jadwal
 * pelatihannya, dan biasanya diisi jauh setelah sesi terakhir. Kegiatan yang
 * belum punya jadwal sama sekali dianggap paling lama (0) supaya tidak
 * mengalahkan yang sudah dijadwalkan.
 */
export function scheduleAnchor(activity: ActivitySchedule): number {
  const times = [
    activity.registrationStart,
    activity.pretestStart,
    activity.materialStart,
    activity.posttestStart,
  ]
    .filter((d): d is Date => d instanceof Date)
    .map((d) => d.getTime());
  return times.length > 0 ? Math.max(...times) : 0;
}

/**
 * Pilih pendaftaran yang dibuka setelah peserta login.
 *
 * Satu orang boleh punya beberapa pendaftaran (pelatihan beda hari), jadi
 * login tidak boleh asal ambil yang terbaru dibikin: yang sedang berjalan
 * hari ini lebih berguna daripada pelatihan bulan depan.
 *
 * Urutannya:
 * 1. Buang kegiatan yang sudah ditutup — selama masih ada yang belum.
 * 2. Di antara yang belum ditutup, pilih yang sesinya sudah mulai dan
 *    paling baru (kegiatan hari ini menang atas kegiatan kemarin).
 * 3. Kalau semua belum mulai, pilih yang paling cepat dibuka.
 * 4. Kalau semua sudah ditutup, pilih yang paling baru.
 */
export function pickDefaultEnrollment<T extends EnrollmentLike>(
  enrollments: T[],
  now: Date
): T | null {
  if (enrollments.length === 0) return null;

  const open = enrollments.filter(
    (e) => activityPhase(e.activity, now) !== "CLOSED"
  );
  const pool = open.length > 0 ? open : enrollments;

  const started = pool.filter(
    (e) => activityPhase(e.activity, now) !== "SCHEDULED"
  );
  if (started.length > 0) {
    return started.reduce((best, e) =>
      scheduleAnchor(e.activity) > scheduleAnchor(best.activity) ? e : best
    );
  }

  return pool.reduce((best, e) =>
    scheduleAnchor(e.activity) < scheduleAnchor(best.activity) ? e : best
  );
}

/**
 * Buang baris import dengan email kembar dan sisakan kemunculan pertama.
 * Email adalah kunci `User` yang unik, jadi file Excel yang memuat satu
 * email dua kali tidak boleh sampai bikin dua user untuk orang yang sama.
 */
export function dedupeByEmail<T extends { email: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = row.email.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
