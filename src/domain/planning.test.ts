import { beforeEach, expect, it, vi } from "vitest";
import { emptyState, today, type Bill } from "./model";
import {
  advanceBill,
  generateBills,
  recordMoney,
  received,
  incomeStatus,
  loanTotals,
  adjustGoal,
} from "./planning";
import {
  balance,
  overview,
  spent,
  saveTransaction,
  removeTransaction,
  payPurchase,
} from "./finance";
import { migrateState, validateState } from "./validation";
import { load, persist, STORAGE_KEY } from "../data/storage";
function fixture() {
  const s = emptyState();
  s.wallets = [
    {
      id: "bank",
      name: "Bank",
      type: "Bank account",
      opening: 100000,
      accessible: true,
      archived: false,
      currency: "NGN",
    },
    {
      id: "locked",
      name: "Locked savings",
      type: "Savings account",
      opening: 100000,
      accessible: false,
      archived: false,
      currency: "NGN",
    },
  ];
  return s;
}
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it("migrates V1 purely, backs up exact bytes on first save, and preserves IDs and money", () => {
  const s = fixture();
  const { incomes, loans, bills, goals, ...base } = s;
  const old = { ...base, version: 1 };
  const raw = JSON.stringify(old, null, 2);
  localStorage.setItem(STORAGE_KEY, raw);
  const migrated = load()!;
  expect(migrated.version).toBe(2);
  expect(migrated.incomes).toEqual([]);
  expect(migrated.wallets).toEqual(s.wallets);
  expect(overview(migrated).accessible).toBe(100000);
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  expect(old.version).toBe(1);
  persist(migrated);
  expect(localStorage.getItem("pokette.backup.before-v2")).toBe(raw);
  expect(load()).toEqual(migrated);
  expect(() => migrateState({ ...old, version: 99 })).toThrow();
  expect(() => migrateState({ ...old, wallets: [{ id: "bad" }] })).toThrow();
});
it("does not overwrite V1 when its backup cannot be written", () => {
  const raw = JSON.stringify({ ...fixture(), version: 1 });
  localStorage.setItem(STORAGE_KEY, raw);
  const s = load()!;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("full");
  });
  expect(() => persist(s)).toThrow();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
});
it("counts only actual receipts and excludes inaccessible receipts from available money", () => {
  let s = fixture();
  s.incomes = [
    {
      id: "work",
      name: "Work",
      amount: 20000,
      due: "2020-01-01",
      recurring: true,
      notes: "",
    },
  ];
  expect(incomeStatus(s, "work")).toBe("Overdue");
  expect(overview(s).accessible).toBe(100000);
  s = recordMoney(s, "receipt", "work", "bank", 5000, today());
  expect(received(s, "work")).toBe(5000);
  expect(incomeStatus(s, "work")).toBe("Partially received");
  s = recordMoney(s, "receipt", "work", "locked", 15000, today());
  expect(incomeStatus(s, "work")).toBe("Received");
  expect(overview(s).accessible).toBe(105000);
  s = removeTransaction(s, s.transactions[0].id, true);
  expect(received(s, "work")).toBe(15000);
  expect(() =>
    recordMoney(s, "receipt", "work", "bank", 100, "2999-01-01"),
  ).toThrow();
});
it.each(["lent", "borrowed"] as const)(
  "tracks %s principal and partial repayments without spending",
  (direction) => {
    let s = fixture();
    s.loans = [{ id: "l", person: "Ada", direction, due: "", notes: "" }];
    s = recordMoney(s, "principal", "l", "bank", 20000, today());
    expect(balance(s, "bank")).toBe(direction === "lent" ? 80000 : 120000);
    expect(s.categories.reduce((n, c) => n + spent(s, c), 0)).toBe(0);
    s = recordMoney(s, "repayment", "l", "bank", 5000, today());
    expect(loanTotals(s, "l")).toEqual({
      principal: 20000,
      repaid: 5000,
      outstanding: 15000,
    });
    expect(() =>
      recordMoney(s, "repayment", "l", "bank", 15001, today()),
    ).toThrow(/exceed/);
    expect(() => removeTransaction(s, s.transactions[0].id)).toThrow(
      /repayments/,
    );
    expect(() =>
      saveTransaction(s, { ...s.transactions[0], amount: 4000 }),
    ).toThrow();
    s = recordMoney(s, "repayment", "l", "bank", 15000, today());
    expect(loanTotals(s, "l").outstanding).toBe(0);
    expect(balance(s, "bank")).toBe(100000);
    s = removeTransaction(s, s.transactions[2].id);
    expect(loanTotals(s, "l").outstanding).toBe(15000);
  },
);
it("distinguishes gifts from loans and disallows repayments of gifts", () => {
  let s = fixture();
  s.loans = [
    { id: "g", person: "Mum", direction: "gift-given", due: "", notes: "" },
  ];
  s = recordMoney(s, "gift", "g", "bank", 2000, today());
  expect(balance(s, "bank")).toBe(98000);
  expect(s.categories.reduce((n, c) => n + spent(s, c), 0)).toBe(2000);
  expect(() =>
    recordMoney(s, "repayment", "g", "bank", 500, today()),
  ).toThrow();
});
function bill(s = fixture()): Bill {
  return {
    id: "spotify",
    name: "Spotify",
    amount: 3000,
    categoryId: s.categories[3].id,
    walletId: "bank",
    frequency: "monthly",
    interval: 1,
    nextDue: "2026-01-31",
    anchorDay: 31,
    active: true,
  };
}
it("keeps month-end anchors and handles leap years, weekly and custom schedules", () => {
  const b = bill();
  expect(advanceBill(b)).toBe("2026-02-28");
  expect(advanceBill({ ...b, nextDue: "2026-02-28" })).toBe("2026-03-31");
  expect(
    advanceBill({
      ...b,
      nextDue: "2024-02-29",
      frequency: "annual",
      anchorDay: 29,
    }),
  ).toBe("2025-02-28");
  expect(
    advanceBill({ ...b, nextDue: "2026-12-28", frequency: "weekly" }),
  ).toBe("2027-01-04");
  expect(
    advanceBill({
      ...b,
      nextDue: "2026-01-31",
      frequency: "custom",
      interval: 3,
    }),
  ).toBe("2026-02-03");
});
it("generates bills idempotently, pauses future additions and pays exactly once", () => {
  let s = fixture();
  s.bills = [bill(s)];
  s = generateBills(s, "2026-03-31");
  expect(s.purchases.map((p) => p.due)).toEqual([
    "2026-01-31",
    "2026-02-28",
    "2026-03-31",
  ]);
  expect(s.bills[0].nextDue).toBe("2026-04-30");
  expect(generateBills(s, "2026-03-31")).toBe(s);
  expect(balance(s, "bank")).toBe(100000);
  expect(overview(s).reserved).toBe(9000);
  s = payPurchase(s, s.purchases[0].id, "bank", 3100);
  s = payPurchase(s, s.purchases[0].id, "bank", 3100);
  expect(s.transactions).toHaveLength(1);
  expect(overview(s).reserved).toBe(6000);
  s.bills[0].active = false;
  expect(generateBills(s, "2026-12-31").purchases).toHaveLength(3);
  validateState(s);
});
it("sets aside, releases and reallocates savings without moving cash or double counting locked wallets", () => {
  let s = fixture();
  s.goals = [
    {
      id: "a",
      name: "Laptop",
      target: 200000,
      saved: 0,
      walletId: "bank",
      deadline: "",
      icon: "☆",
      color: "#DCC9F5",
    },
    {
      id: "b",
      name: "Holiday",
      target: 200000,
      saved: 0,
      walletId: "locked",
      deadline: "",
      icon: "☆",
      color: "#DCC9F5",
    },
  ];
  s = adjustGoal(s, "a", 20000, "deposit");
  expect(overview(s).safe).toBe(80000);
  s = adjustGoal(s, "b", 30000, "deposit");
  expect(overview(s).safe).toBe(80000);
  expect(balance(s, "bank")).toBe(100000);
  expect(s.transactions).toEqual([]);
  expect(() => adjustGoal(s, "a", 100000, "deposit")).toThrow(/enough/);
  expect(() => adjustGoal(s, "a", 20001, "withdraw")).toThrow();
  s = adjustGoal(s, "a", 5000, "withdraw", "b");
  expect(s.goals.map((g) => g.saved)).toEqual([15000, 35000]);
  expect(overview(s).safe).toBe(85000);
  s = adjustGoal(s, "a", 15000, "withdraw");
  expect(overview(s).safe).toBe(100000);
});
it("rejects broken planning links and unsafe saved amounts", () => {
  const s = fixture();
  s.incomes = [
    {
      id: "i",
      name: "Work",
      amount: 100,
      due: today(),
      recurring: false,
      notes: "",
    },
  ];
  const next = recordMoney(s, "receipt", "i", "bank", 100, today());
  expect(() => validateState({ ...next, incomes: [] })).toThrow();
  expect(() =>
    validateState({ ...s, incomes: [{ ...s.incomes[0], amount: 1.5 }] }),
  ).toThrow();
});
