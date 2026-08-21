import { describe, expect, it } from "vitest";
import {
  activityPhase,
  jakartaInputToDate,
  toJakartaInputValue,
} from "../activity-phase";

const NOW = new Date("2026-09-05T10:00:00Z");
const PAST = (min: number) => new Date(NOW.getTime() - min * 60_000);
const FUTURE = (min: number) => new Date(NOW.getTime() + min * 60_000);

describe("activityPhase", () => {
  it("semua null -> REGISTRATION", () => {
    expect(activityPhase({}, NOW)).toBe("REGISTRATION");
  });

  it("ada tanggal tapi belum mulai -> SCHEDULED", () => {
    expect(activityPhase({ registrationStart: FUTURE(60) }, NOW)).toBe(
      "SCHEDULED"
    );
  });

  it("registration lewat -> REGISTRATION", () => {
    expect(activityPhase({ registrationStart: PAST(60) }, NOW)).toBe(
      "REGISTRATION"
    );
  });

  it("pretest lewat -> PRETEST", () => {
    expect(
      activityPhase(
        { registrationStart: PAST(120), pretestStart: PAST(60) },
        NOW
      )
    ).toBe("PRETEST");
  });

  it("start terakhir yang terlewat menang", () => {
    expect(
      activityPhase(
        {
          registrationStart: PAST(240),
          pretestStart: PAST(120),
          materialStart: PAST(60),
          posttestStart: FUTURE(60),
        },
        NOW
      )
    ).toBe("MATERIAL");
  });

  it("null di tengah = fase dilewati", () => {
    expect(
      activityPhase(
        { registrationStart: PAST(120), materialStart: PAST(60) },
        NOW
      )
    ).toBe("MATERIAL");
  });

  it("closedAt terlewat menang atas semua", () => {
    expect(
      activityPhase(
        {
          registrationStart: PAST(240),
          posttestStart: PAST(60),
          closedAt: PAST(1),
        },
        NOW
      )
    ).toBe("CLOSED");
  });

  it("closedAt belum lewat tidak menutup", () => {
    expect(
      activityPhase({ posttestStart: PAST(60), closedAt: FUTURE(60) }, NOW)
    ).toBe("POSTTEST");
  });

  it("boundary: == now dianggap terlewat", () => {
    expect(activityPhase({ pretestStart: NOW }, NOW)).toBe("PRETEST");
  });
});

describe("helper waktu Jakarta", () => {
  it("jakartaInputToDate menghasilkan UTC yang benar", () => {
    expect(jakartaInputToDate("2026-09-05T05:00").toISOString()).toBe(
      "2026-09-04T22:00:00.000Z"
    );
  });

  it("toJakartaInputValue round-trip", () => {
    const d = jakartaInputToDate("2026-09-05T13:30");
    expect(toJakartaInputValue(d)).toBe("2026-09-05T13:30");
  });
});
