import assert from "node:assert/strict";
import { test } from "node:test";
import { heatingAt, heatingWindow, isHoliday, weekday } from "./heating.ts";

const defaults = {
  weekday_heating_hours: 8,
  non_workday_heating_hours: 2,
  weekday_start_hour: 7,
  outdoor_shutdown_temperature_c: 15,
};

test("weekday matches Python's (Monday = 0)", () => {
  assert.equal(weekday({ year: 2018, month: 2, day: 12 }), 0); // a Monday
  assert.equal(weekday({ year: 2019, month: 3, day: 31 }), 6); // a Sunday
});

test("Easter Monday and fixed days are holidays", () => {
  assert.ok(isHoliday({ year: 2019, month: 4, day: 22 }));
  assert.ok(isHoliday({ year: 2018, month: 1, day: 6 }));
  assert.ok(!isHoliday({ year: 2018, month: 2, day: 13 }));
});

test("weekday window: start to start + hours", () => {
  assert.deepEqual(heatingWindow({ year: 2018, month: 2, day: 13 }, defaults), [7, 15]);
});

test("weekend uses the weekend hours", () => {
  assert.deepEqual(heatingWindow({ year: 2018, month: 2, day: 17 }, defaults), [7, 9]);
});

test("legal limits: never before 05:00, never after 23:00, at most 14 hours", () => {
  const p = { ...defaults, weekday_start_hour: 4, weekday_heating_hours: 20 };
  assert.deepEqual(heatingWindow({ year: 2018, month: 2, day: 13 }, p), [5, 19]);
  const late = { ...defaults, weekday_start_hour: 9, weekday_heating_hours: 16 };
  assert.deepEqual(heatingWindow({ year: 2018, month: 2, day: 13 }, late), [9, 23]);
});

test("no heating out of season", () => {
  assert.equal(heatingWindow({ year: 2018, month: 6, day: 1 }, defaults), null);
});

test("warm days switch the heating off inside its hours", () => {
  const d = { year: 2018, month: 2, day: 13 };
  assert.equal(heatingAt(d, 10, 3.2, defaults), "on");
  assert.equal(heatingAt(d, 10, 16, defaults), "off-warm");
  assert.equal(heatingAt(d, 20, 3.2, defaults), "off-hours");
});
