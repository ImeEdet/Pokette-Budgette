import { describe, it, expect } from "vitest";
import { emptyState, today, uid, type State, type Transaction } from "./model";
import {
  balance,
  moneyInput,
  overview,
  saveTransaction,
  payPurchase,
  removeTransaction,
  purchaseTotals,
  spent,
} from "./finance";
import { persist, load, demoState, STORAGE_KEY } from "../data/storage";
function fixture() {
  const s = emptyState();
  s.wallets = [
    {
      id: "a",
      name: "Bank",
      type: "Bank account",
      opening: 10000,
      accessible: true,
      archived: false,
      currency: "NGN",
    },
    {
      id: "b",
      name: "Cash",
      type: "Cash",
      opening: 2000,
      accessible: true,
      archived: false,
      currency: "NGN",
    },
  ];
  return s;
}
function tx(s: State, changes: Partial<Transaction> = {}): Transaction {
  return {
    id: uid(),
    type: "expense",
    walletId: "a",
    categoryId: s.categories[0].id,
    amount: 1000,
    date: today(),
    description: "Test",
    notes: "",
    ...changes,
  };
}
describe("money and ledger correctness", () => {
  it("reserves item estimates, releases cancellations, and debits only actual payments", () => {
    let s = fixture();
    s.purchases = [
      {
        id: "spotify",
        categoryId: s.categories[3].id,
        name: "Spotify",
        estimate: 2000,
        quantity: 1,
        actual: 0,
        status: "planned",
        notes: "",
        priority: "Medium",
        due: today(),
      },
    ];
    expect(overview(s)).toEqual({
      accessible: 12000,
      reserved: 2000,
      safe: 10000,
    });
    s.purchases[0].status = "cancelled";
    expect(overview(s).reserved).toBe(0);
    expect(balance(s, "a")).toBe(10000);
    s.purchases[0].status = "planned";
    s = payPurchase(s, "spotify", "a", 1800);
    expect(overview(s)).toEqual({
      accessible: 10200,
      reserved: 0,
      safe: 10200,
    });
    s = removeTransaction(s, s.transactions[0].id, true);
    expect(overview(s)).toEqual({
      accessible: 12000,
      reserved: 1800,
      safe: 10200,
    });
  });
  it("covers unpaid items above a legacy limit and across dates without double counting", () => {
    const s = fixture();
    s.categories[0].allocation = 1000;
    s.purchases = [
      {
        id: "p",
        categoryId: s.categories[0].id,
        name: "NEPA",
        estimate: 3000,
        quantity: 1,
        actual: 0,
        status: "planned",
        notes: "",
        priority: "Medium",
        due: "2999-01-01",
      },
    ];
    expect(overview(s).reserved).toBe(3000);
    s.categories[0].archived = true;
    expect(overview(s).reserved).toBe(3000);
  });
  it("parses exact integer minor units and rejects ambiguous amounts", () => {
    expect(moneyInput("0.29")).toBe(29);
    expect(moneyInput("123.4")).toBe(12340);
    expect(moneyInput("-5.01", true)).toBe(-501);
    for (const x of ["1.001", "1e3", "NaN", "-1", "1,000"])
      expect(() => moneyInput(x)).toThrow();
  });
  it("income increases only the destination wallet and expenses decrease it", () => {
    let s = fixture();
    s = saveTransaction(s, tx(s, { type: "income", amount: 2500 }));
    expect(balance(s, "a")).toBe(12500);
    expect(balance(s, "b")).toBe(2000);
    s = saveTransaction(s, tx(s, { amount: 300 }));
    expect(balance(s, "a")).toBe(12200);
  });
  it("transfers preserve total money without category spending", () => {
    let s = fixture();
    s = saveTransaction(
      s,
      tx(s, { type: "transfer", toWalletId: "b", amount: 1234 }),
    );
    expect(balance(s, "a")).toBe(8766);
    expect(balance(s, "b")).toBe(3234);
    expect(overview(s).accessible).toBe(12000);
    expect(spent(s, s.categories[0])).toBe(0);
    expect(() =>
      saveTransaction(s, tx(s, { type: "transfer", toWalletId: "a" })),
    ).toThrow();
  });
  it("inaccessible money is excluded but archive never erases a balance", () => {
    const s = fixture();
    s.wallets[1].accessible = false;
    s.wallets[0].archived = true;
    expect(overview(s).accessible).toBe(10000);
  });
  it("edits, deletions and reversals recalculate the ledger", () => {
    let s = fixture();
    const t = tx(s);
    s = saveTransaction(s, t);
    s = saveTransaction(s, { ...t, amount: 500 });
    expect(balance(s, "a")).toBe(9500);
    expect(s.transactions).toHaveLength(1);
    expect(balance(removeTransaction(s, t.id), "a")).toBe(10000);
    expect(balance(removeTransaction(s, t.id, true), "a")).toBe(10000);
  });
  it("future expected receipts cannot enter accessible cash", () => {
    const s = fixture();
    expect(() =>
      saveTransaction(s, tx(s, { type: "income", date: "2999-01-01" })),
    ).toThrow();
    expect(overview(s).accessible).toBe(12000);
  });
  it("budget reservation releases as spent and does not double reserve plans", () => {
    let s = fixture();
    s.categories[0].allocation = 5000;
    s.purchases = [
      {
        id: "p",
        categoryId: s.categories[0].id,
        name: "Notebook",
        estimate: 1000,
        actual: 0,
        quantity: 2,
        priority: "Low",
        notes: "",
        due: "",
        status: "planned",
      },
    ];
    expect(balance(s, "a")).toBe(10000);
    expect(overview(s)).toEqual({
      accessible: 12000,
      reserved: 5000,
      safe: 7000,
    });
    s = saveTransaction(s, tx(s, { amount: 1000 }));
    expect(overview(s)).toEqual({
      accessible: 11000,
      reserved: 4000,
      safe: 7000,
    });
    expect(purchaseTotals(s).planned).toBe(2000);
  });
  it("paid purchase is idempotent and deletion returns it to unpaid", () => {
    let s = fixture();
    s.purchases = [
      {
        id: "p",
        categoryId: s.categories[0].id,
        name: "Notebook",
        estimate: 1000,
        actual: 0,
        quantity: 2,
        priority: "Low",
        notes: "",
        due: "",
        status: "planned",
      },
    ];
    s = payPurchase(s, "p", "a", 2100);
    s = payPurchase(s, "p", "a", 2100);
    expect(s.transactions).toHaveLength(1);
    expect(balance(s, "a")).toBe(7900);
    expect(purchaseTotals(s)).toEqual({ planned: 0, committed: 0, paid: 2100 });
    s = saveTransaction(s, { ...s.transactions[0], amount: 2200 });
    expect(s.purchases[0].actual).toBe(2200);
    s = removeTransaction(s, s.transactions[0].id);
    expect(s.purchases[0].status).toBe("purchased");
    expect(balance(s, "a")).toBe(10000);
  });
  it("links an existing expense without another debit", () => {
    let s = fixture();
    s = saveTransaction(s, tx(s));
    s.purchases = [
      {
        id: "p",
        categoryId: s.categories[0].id,
        name: "Notebook",
        estimate: 1000,
        actual: 0,
        quantity: 1,
        priority: "Low",
        notes: "",
        due: "",
        status: "planned",
      },
    ];
    s = payPurchase(s, "p", "a", 0, s.transactions[0].id);
    expect(s.transactions).toHaveLength(1);
    expect(balance(s, "a")).toBe(9000);
  });
  it("cancelled plans do not contribute and overspending stays negative", () => {
    let s = fixture();
    s = saveTransaction(s, tx(s, { amount: 15000 }));
    expect(overview(s).safe).toBe(-3000);
    s.purchases = [
      {
        id: "p",
        categoryId: s.categories[0].id,
        name: "Notebook",
        estimate: 1000,
        actual: 0,
        quantity: 1,
        priority: "Low",
        notes: "",
        due: "",
        status: "cancelled",
      },
    ];
    expect(purchaseTotals(s).planned).toBe(0);
  });
  it("storage roundtrips and demo cannot contaminate a fresh workspace", () => {
    persist(demoState());
    expect(load()?.mode).toBe("demo");
    persist(emptyState());
    expect(load()?.transactions).toHaveLength(0);
    const base = fixture();
    const s = saveTransaction(base, tx(base));
    persist(s);
    expect(load()).toEqual(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999 }));
    expect(() => load()).toThrow();
    localStorage.clear();
  });
});
