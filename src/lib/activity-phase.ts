export type ActivityPhase =
  | "SCHEDULED"
  | "REGISTRATION"
  | "PRETEST"
  | "MATERIAL"
  | "POSTTEST"
  | "CLOSED";

export type ActivitySchedule = {
  registrationStart?: Date | null;
  pretestStart?: Date | null;
  materialStart?: Date | null;
  posttestStart?: Date | null;
  closedAt?: Date | null;
};

const PHASE_ORDER: {
  phase: Exclude<ActivityPhase, "SCHEDULED" | "CLOSED">;
  key: keyof ActivitySchedule;
}[] = [
  { phase: "REGISTRATION", key: "registrationStart" },
  { phase: "PRETEST", key: "pretestStart" },
  { phase: "MATERIAL", key: "materialStart" },
  { phase: "POSTTEST", key: "posttestStart" },
];

export function activityPhase(
  schedule: ActivitySchedule,
  now: Date
): ActivityPhase {
  if (schedule.closedAt && schedule.closedAt.getTime() <= now.getTime()) {
    return "CLOSED";
  }
  let current: ActivityPhase | null = null;
  let anySet = false;
  for (const { phase, key } of PHASE_ORDER) {
    const d = schedule[key];
    if (!d) continue;
    anySet = true;
    if (d.getTime() <= now.getTime()) current = phase;
  }
  return current ?? (anySet ? "SCHEDULED" : "REGISTRATION");
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Date -> nilai input datetime-local dalam waktu Jakarta (WIB). */
export function toJakartaInputValue(date: Date): string {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
    .toISOString()
    .slice(0, 16);
}

/** Nilai input datetime-local (WIB) -> Date UTC. */
export function jakartaInputToDate(value: string): Date {
  return new Date(`${value}:00+07:00`);
}
