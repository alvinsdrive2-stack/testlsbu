export type GrowthRange = "week" | "month" | "year";

export type CountRow = { createdAt: Date; count: number };

export type RawCountRow = { day: string; c: number | bigint };

/** Baris agregat SQL (per hari WIB) → instant UTC yang cocok dengan bucketOf. */
export function toCountRows(rows: RawCountRow[]): CountRow[] {
  return rows.map((r) => ({
    createdAt: new Date(Date.parse(`${r.day}T00:00:00Z`) - JST),
    count: Number(r.c),
  }));
}

export type GrowthBucket = {
  label: string;
  activities: number;
  participants: number;
  prevActivities: number;
  prevParticipants: number;
};

export type GrowthData = {
  range: GrowthRange;
  compare: boolean;
  buckets: GrowthBucket[];
  totals: {
    activities: number;
    participants: number;
    prevActivities: number;
    prevParticipants: number;
  };
};

const JST = 7 * 3_600_000;
const DAY = 86_400_000;
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Awal UTC dari bucket terlama periode sebelumnya (window 2 periode). */
export function growthSince(range: GrowthRange): Date {
  if (range === "year") {
    const shifted = new Date(Date.now() + JST);
    const curMonth = shifted.getUTCFullYear() * 12 + shifted.getUTCMonth();
    const m = curMonth - 23;
    return new Date(
      Date.UTC(Math.floor(m / 12), ((m % 12) + 12) % 12, 1) - JST
    );
  }
  const n = range === "week" ? 7 : 30;
  return new Date((Math.floor((Date.now() + JST) / DAY) - (2 * n - 1)) * DAY - JST);
}

export function buildGrowth(
  range: GrowthRange,
  activities: CountRow[],
  participants: CountRow[]
): Omit<GrowthData, "compare"> {
  const now = new Date();
  const nowDay = Math.floor((now.getTime() + JST) / DAY);
  let n: number;
  let labels: string[];
  let bucketOf: (t: Date) => number;

  if (range === "year") {
    const shifted = new Date(now.getTime() + JST);
    const curMonth = shifted.getUTCFullYear() * 12 + shifted.getUTCMonth();
    n = 12;
    labels = Array.from({ length: n }, (_, i) => {
      const m = curMonth - (n - 1 - i);
      return MONTHS[((m % 12) + 12) % 12];
    });
    bucketOf = (t) => {
      const s = new Date(t.getTime() + JST);
      const diff = curMonth - (s.getUTCFullYear() * 12 + s.getUTCMonth());
      if (diff >= 0 && diff < n) return n - 1 - diff;
      if (diff >= n && diff < 2 * n) return 2 * n - 1 - diff;
      return -1;
    };
  } else {
    n = range === "week" ? 7 : 30;
    labels = Array.from({ length: n }, (_, i) => {
      const day = nowDay - (n - 1 - i);
      if (range === "week") return WEEKDAYS[new Date(day * DAY).getUTCDay()];
      const s = new Date(day * DAY);
      return `${s.getUTCDate()}/${s.getUTCMonth() + 1}`;
    });
    bucketOf = (t) => {
      const diff = nowDay - Math.floor((t.getTime() + JST) / DAY);
      if (diff >= 0 && diff < n) return n - 1 - diff;
      if (diff >= n && diff < 2 * n) return 2 * n - 1 - diff;
      return -1;
    };
  }

  const buckets: GrowthBucket[] = Array.from({ length: n }, () => ({
    label: "",
    activities: 0,
    participants: 0,
    prevActivities: 0,
    prevParticipants: 0,
  }));
  for (let i = 0; i < n; i++) buckets[i].label = labels[i];

  const totals = {
    activities: 0,
    participants: 0,
    prevActivities: 0,
    prevParticipants: 0,
  };
  const fill = (
    rows: CountRow[],
    key: "activities" | "participants",
    prevKey: "prevActivities" | "prevParticipants"
  ) => {
    for (const r of rows) {
      const b = bucketOf(r.createdAt);
      if (b < 0) continue;
      if (b < n) {
        buckets[b][key] += r.count;
        totals[key] += r.count;
      } else {
        buckets[b - n][prevKey] += r.count;
        totals[prevKey] += r.count;
      }
    }
  };
  fill(activities, "activities", "prevActivities");
  fill(participants, "participants", "prevParticipants");

  return { range, buckets, totals };
}
