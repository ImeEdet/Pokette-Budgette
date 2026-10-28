import { expect, it } from "vitest";
import { validDate, validateState } from "./validation";
import { demoState } from "../data/storage";
import { periodDates } from "./model";
it("validates calendar boundaries including leap years", () => {
  expect(validDate("2024-02-29")).toBe(true);
  expect(validDate("2025-02-29")).toBe(false);
  expect(validDate("2026-04-31")).toBe(false);
  expect(periodDates("weekly", "2026-11-01")).toEqual({
    start: "2026-10-26",
    end: "2026-11-01",
  });
  expect(periodDates("monthly", "2024-02-20")).toEqual({
    start: "2024-02-01",
    end: "2024-02-29",
  });
});
it("rejects corrupt money and orphaned ledger references", () => {
  const s = demoState();
  expect(() => validateState(s)).not.toThrow();
  s.transactions[0].amount = 1.25;
  expect(() => validateState(s)).toThrow();
  s.transactions[0].amount = 100;
  s.transactions[0].walletId = "missing";
  expect(() => validateState(s)).toThrow();
});
