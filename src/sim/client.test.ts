import assert from "node:assert/strict";
import { test } from "node:test";

test("one building runs four year and regime jobs and blends their hourly heat", async () => {
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const previousWorker = globalThis.Worker;
  const calls: { year: number; reduced: boolean; type: string }[] = [];

  class FakeWorker {
    onmessage?: (event: { data: unknown }) => void;
    onerror?: (event: unknown) => void;
    onmessageerror?: () => void;

    postMessage(message: { type: string; id?: number; year?: number; reduced?: boolean }) {
      if (message.type === "warmup") return;
      calls.push({ year: message.year!, reduced: message.reduced!, type: message.type });
      queueMicrotask(() => this.onmessage?.({ data: message.type === "run_regime"
        ? {
          type: "regime_result", id: message.id,
          data: {
            year: message.year, reduced: message.reduced,
            heat: message.reduced ? [500, 1000] : [1000, 2000],
            months: [2, 3], normalFraction: 0.8, efficiency: 1,
          },
        }
        : { type: "year_result", id: message.id, rows: [{ year: message.year, month: 2, kwh: 999 }] },
      }));
    }
  }

  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { hardwareConcurrency: 8 } });
  Object.assign(globalThis, { Worker: FakeWorker });
  try {
    const { simulate } = await import(`./client.ts?four-regimes=${Date.now()}`);
    const yearsDone: number[] = [];
    const rows = await simulate("building_01", { occupied_heating_setpoint_c: 21 }, (year: number) => yearsDone.push(year));
    assert.equal(calls.length, 4);
    assert.deepEqual(calls.map(({ year, reduced, type }) => [year, reduced, type]), [
      [2018, false, "run_regime"], [2018, true, "run_regime"],
      [2019, false, "run_regime"], [2019, true, "run_regime"],
    ]);
    assert.deepEqual(rows, [
      { year: 2018, month: 2, kwh: 0.9 },
      { year: 2018, month: 3, kwh: 1.8 },
      { year: 2019, month: 2, kwh: 0.9 },
      { year: 2019, month: 3, kwh: 1.8 },
    ]);
    assert.deepEqual(yearsDone, [2018, 2019]);
  } finally {
    if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
    if (previousWorker === undefined) Reflect.deleteProperty(globalThis, "Worker");
    else Object.assign(globalThis, { Worker: previousWorker });
  }
});

test("small worker pools keep the organizer's two year jobs", async () => {
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const previousWorker = globalThis.Worker;
  const calls: { type: string; year: number }[] = [];

  class FakeWorker {
    onmessage?: (event: { data: unknown }) => void;
    onerror?: (event: unknown) => void;
    onmessageerror?: () => void;

    postMessage(message: { type: string; id?: number; year?: number; reduced?: boolean }) {
      if (message.type === "warmup") return;
      calls.push({ type: message.type, year: message.year! });
      queueMicrotask(() => this.onmessage?.({ data: message.type === "run"
        ? { type: "year_result", id: message.id, rows: [{ year: message.year, month: 2, kwh: message.year }] }
        : { type: "regime_result", id: message.id, data: {
          year: message.year, reduced: message.reduced,
          heat: [1000], months: [2], normalFraction: 1, efficiency: 1,
        } },
      }));
    }
  }

  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { hardwareConcurrency: 4 } });
  Object.assign(globalThis, { Worker: FakeWorker });
  try {
    const { simulate } = await import(`./client.ts?small-pool=${Date.now()}`);
    const yearsDone: number[] = [];
    const rows = await simulate("building_01", { occupied_heating_setpoint_c: 21 }, (year: number) => yearsDone.push(year));
    assert.deepEqual(calls, [{ type: "run", year: 2018 }, { type: "run", year: 2019 }]);
    assert.deepEqual(rows, [
      { year: 2018, month: 2, kwh: 2018 },
      { year: 2019, month: 2, kwh: 2019 },
    ]);
    assert.deepEqual(yearsDone, [2018, 2019]);
  } finally {
    if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
    if (previousWorker === undefined) Reflect.deleteProperty(globalThis, "Worker");
    else Object.assign(globalThis, { Worker: previousWorker });
  }
});
