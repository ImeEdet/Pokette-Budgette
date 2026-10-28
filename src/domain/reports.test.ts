import { it, expect } from "vitest";
import { emptyState, today } from "./model";
import { dateRange, report } from "./reports";
import { overview } from "./finance";
it("uses calendar boundaries across years and leap months", () => {
  expect(dateRange("last-month", "2026-01-10")).toEqual({
    start: "2025-12-01",
    end: "2025-12-31",
  });
  expect(dateRange("last-month", "2024-03-02")).toEqual({
    start: "2024-02-01",
    end: "2024-02-29",
  });
  expect(dateRange("three-months", "2026-01-10")).toEqual({
    start: "2025-11-01",
    end: "2026-01-10",
  });
});
it("excludes transfers, promises and reversed entries; separates loans from ordinary income/spending", () => {
  const s = emptyState();
  const base = {
    walletId: "w",
    date: today(),
    notes: "",
    description: "entry",
    categoryId: s.categories[0].id,
  };
  s.transactions = [
    { ...base, id: "income", type: "income", amount: 10000 },
    { ...base, id: "expense", type: "expense", amount: 3000 },
    {
      ...base,
      id: "loan",
      type: "income",
      amount: 7000,
      link: { kind: "principal", id: "l" },
    },
    {
      ...base,
      id: "repayment",
      type: "expense",
      amount: 1000,
      link: { kind: "repayment", id: "l" },
    },
    {
      ...base,
      id: "transfer",
      type: "transfer",
      amount: 9000,
      toWalletId: "x",
    },
    { ...base, id: "reversed", type: "expense", amount: 500, reversed: true },
  ];
  s.incomes = [
    {
      id: "expected",
      name: "Promise",
      amount: 50000,
      due: today(),
      recurring: false,
      notes: "",
    },
  ];
  const r = report(s, today(), today());
  expect(r.income).toBe(10000);
  expect(r.expenses).toBe(3000);
  expect(r.cashFlow).toBe(13000);
  expect(r.net).toBe(7000);
  expect(r.categories[0].percentage).toBe(100);
  expect(r.totals).toEqual(overview(s));
});
it("filters inclusive dates and excludes cancelled and undated item estimates", () => {
  const s = emptyState();
  const base = {
    categoryId: s.categories[0].id,
    estimate: 100,
    quantity: 2,
    actual: 0,
    name: "Item",
    notes: "",
    priority: "Medium",
  };
  s.purchases = [
    { ...base, id: "a", due: "2026-01-01", status: "planned" },
    { ...base, id: "b", due: "2026-01-31", status: "paid" },
    { ...base, id: "c", due: "", status: "planned" },
    { ...base, id: "d", due: "2026-01-10", status: "cancelled" },
    { ...base, id: "e", due: "2026-02-01", status: "planned" },
  ];
  const r = report(s, "2026-01-01", "2026-01-31");
  expect(r.categories[0].planned).toBe(400);
  expect(r.undated).toBe(1);
  expect(() => report(s, "2026-02-30", "2026-03-01")).toThrow();
  expect(() => report(s, "2026-03-02", "2026-03-01")).toThrow();
});
