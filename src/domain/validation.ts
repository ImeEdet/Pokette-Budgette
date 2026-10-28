import { type State } from "./model";
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
export function validateState(value: unknown): asserts value is State {
  const fail = () => {
    throw new Error(
      "This saved workspace cannot be opened safely. Your stored data has not been changed.",
    );
  };
  if (!value || typeof value !== "object") return fail();
  const s = value as State;
  if (
    s.version !== 2 ||
    !["fresh", "demo"].includes(s.mode) ||
    ![
      s.wallets,
      s.transactions,
      s.categories,
      s.purchases,
      s.incomes,
      s.loans,
      s.bills,
      s.goals,
    ].every(Array.isArray)
  )
    return fail();
  const amount = (n: number) => Number.isSafeInteger(n) && Math.abs(n) <= 1e13;
  const text = (v: unknown) => typeof v === "string";
  for (const records of [
    s.wallets,
    s.transactions,
    s.categories,
    s.purchases,
    s.incomes,
    s.loans,
    s.bills,
    s.goals,
  ]) {
    const ids = new Set();
    for (const r of records) {
      if (!r || !text(r.id) || !r.id || ids.has(r.id)) return fail();
      ids.add(r.id);
    }
  }
  for (const w of s.wallets)
    if (
      !text(w.name) ||
      !text(w.type) ||
      !amount(w.opening) ||
      w.currency !== "NGN" ||
      typeof w.accessible !== "boolean" ||
      typeof w.archived !== "boolean"
    )
      return fail();
  for (const c of s.categories)
    if (
      !text(c.name) ||
      !text(c.icon) ||
      !/^#[0-9a-f]{6}$/i.test(c.color) ||
      !amount(c.allocation) ||
      c.allocation < 0 ||
      !validDate(c.start) ||
      !validDate(c.end) ||
      c.end < c.start ||
      !["monthly", "weekly", "custom"].includes(c.period) ||
      !text(c.notes) ||
      typeof c.archived !== "boolean"
    )
      return fail();
  for (const t of s.transactions)
    if (
      !["income", "expense", "transfer"].includes(t.type) ||
      !s.wallets.some((w) => w.id === t.walletId) ||
      !amount(t.amount) ||
      t.amount <= 0 ||
      !validDate(t.date) ||
      !text(t.description) ||
      !text(t.notes) ||
      (t.reversed !== undefined && typeof t.reversed !== "boolean") ||
      (t.type === "expense" &&
        !s.categories.some((c) => c.id === t.categoryId)) ||
      (t.type === "transfer" &&
        (!s.wallets.some((w) => w.id === t.toWalletId) ||
          t.walletId === t.toWalletId))
    )
      return fail();
  const links = new Set<string>();
  for (const i of s.incomes)
    if (
      !text(i.name) ||
      !i.name.trim() ||
      !amount(i.amount) ||
      i.amount <= 0 ||
      !validDate(i.due) ||
      typeof i.recurring !== "boolean" ||
      !text(i.notes)
    )
      return fail();
  for (const l of s.loans)
    if (
      !text(l.person) ||
      !l.person.trim() ||
      !["lent", "borrowed", "gift-given", "gift-received"].includes(
        l.direction,
      ) ||
      (l.due !== "" && !validDate(l.due)) ||
      !text(l.notes)
    )
      return fail();
  for (const b of s.bills)
    if (
      !text(b.name) ||
      !b.name.trim() ||
      !amount(b.amount) ||
      b.amount <= 0 ||
      !s.categories.some((c) => c.id === b.categoryId) ||
      !s.wallets.some((w) => w.id === b.walletId) ||
      !["weekly", "monthly", "annual", "custom"].includes(b.frequency) ||
      !Number.isInteger(b.interval) ||
      b.interval < 1 ||
      b.interval > 366 ||
      !validDate(b.nextDue) ||
      !Number.isInteger(b.anchorDay) ||
      b.anchorDay < 1 ||
      b.anchorDay > 31 ||
      typeof b.active !== "boolean"
    )
      return fail();
  for (const g of s.goals)
    if (
      !text(g.name) ||
      !g.name.trim() ||
      !amount(g.target) ||
      g.target <= 0 ||
      !amount(g.saved) ||
      g.saved < 0 ||
      !s.wallets.some((w) => w.id === g.walletId) ||
      (g.deadline !== "" && !validDate(g.deadline)) ||
      !text(g.icon) ||
      !/^#[0-9a-f]{6}$/i.test(g.color)
    )
      return fail();
  for (const t of s.transactions) {
    if (!t.link) continue;
    const { kind, id } = t.link;
    if (kind === "receipt") {
      if (!s.incomes.some((i) => i.id === id) || t.type !== "income")
        return fail();
    } else {
      const l = s.loans.find((l) => l.id === id);
      if (!l || !["principal", "repayment", "gift"].includes(kind))
        return fail();
      const gift = l.direction.startsWith("gift");
      if ((kind === "gift") !== gift) return fail();
      const incoming =
        kind === "repayment"
          ? l.direction === "lent"
          : ["borrowed", "gift-received"].includes(l.direction);
      if (t.type !== (incoming ? "income" : "expense")) return fail();
    }
  }
  for (const l of s.loans) {
    const ts = s.transactions.filter(
      (t) => !t.reversed && t.link?.id === l.id && t.link.kind !== "receipt",
    );
    const initial = ts.filter((t) => t.link?.kind !== "repayment");
    if (initial.length > 1) return fail();
    if (
      ts
        .filter((t) => t.link?.kind === "repayment")
        .reduce((n, t) => n + t.amount, 0) > (initial[0]?.amount ?? 0)
    )
      return fail();
  }
  for (const p of s.purchases) {
    if (p.billId !== undefined && !s.bills.some((b) => b.id === p.billId))
      return fail();
    if (
      !text(p.name) ||
      !text(p.notes) ||
      !text(p.priority) ||
      !s.categories.some((c) => c.id === p.categoryId) ||
      !amount(p.estimate) ||
      p.estimate < 0 ||
      !amount(p.actual) ||
      p.actual < 0 ||
      !Number.isSafeInteger(p.quantity) ||
      p.quantity < 1 ||
      p.quantity > 10000 ||
      !amount(p.quantity * p.estimate) ||
      !["planned", "purchased", "paid", "cancelled"].includes(p.status) ||
      (p.due !== "" && !validDate(p.due))
    )
      return fail();
    if (p.status === "paid") {
      const t = s.transactions.find((t) => t.id === p.expenseId);
      if (
        !t ||
        t.reversed ||
        t.type !== "expense" ||
        t.categoryId !== p.categoryId ||
        p.actual !== t.amount ||
        links.has(t.id)
      )
        return fail();
      links.add(t.id);
    } else if (p.expenseId) return fail();
  }
}

// Pure migration: the caller backs up the original bytes before first V2 save.
export function migrateState(value: unknown): State {
  if (!value || typeof value !== "object")
    throw new Error("Saved workspace is invalid.");
  const old = value as Record<string, unknown>;
  const next =
    old.version === 1
      ? { ...old, version: 2, incomes: [], loans: [], bills: [], goals: [] }
      : old;
  validateState(next);
  return next;
}
