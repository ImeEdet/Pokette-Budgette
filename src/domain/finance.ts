import {
  type State,
  type Transaction,
  type Category,
  today,
  uid,
} from "./model";
import { validDate, validateState } from "./validation";
export const isSpending = (t: Transaction) =>
  t.type === "expense" &&
  t.link?.kind !== "principal" &&
  t.link?.kind !== "repayment";
export function moneyInput(value: string, signed = false): number {
  value = value.trim();
  if (!(signed ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/).test(value))
    throw new Error("Enter a valid amount with up to two decimal places.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const result =
    (Number(whole) * 100 + Number(fraction.padEnd(2, "0"))) *
    (negative ? -1 : 1);
  if (!Number.isSafeInteger(result) || Math.abs(result) > 1e13)
    throw new Error("Amount is too large.");
  return result;
}
export const money = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount / 100);
export function balance(s: State, id: string) {
  return s.transactions
    .filter((t) => !t.reversed)
    .reduce(
      (sum, t) =>
        sum +
        (t.walletId === id ? (t.type === "income" ? t.amount : -t.amount) : 0) +
        (t.type === "transfer" && t.toWalletId === id ? t.amount : 0),
      s.wallets.find((w) => w.id === id)?.opening ?? 0,
    );
}
export function spent(s: State, c: Category) {
  return s.transactions
    .filter(
      (t) =>
        !t.reversed &&
        isSpending(t) &&
        t.categoryId === c.id &&
        t.date >= c.start &&
        t.date <= c.end,
    )
    .reduce((sum, t) => sum + t.amount, 0);
}
export function overview(s: State, date = today()) {
  const accessible = s.wallets
    .filter((w) => w.accessible)
    .reduce((sum, w) => sum + balance(s, w.id), 0);
  const reserved = s.categories.reduce((sum, c) => {
    const unpaid = s.purchases
      .filter(
        (p) =>
          p.categoryId === c.id &&
          (p.status === "planned" || p.status === "purchased"),
      )
      .reduce((n, p) => n + (p.actual || p.estimate * p.quantity), 0);
    // Preserve older category envelopes without reserving the same items twice.
    const envelope =
      !c.archived && c.start <= date && c.end >= date
        ? Math.max(0, c.allocation - spent(s, c))
        : 0;
    return sum + Math.max(envelope, unpaid);
  }, 0);
  const savings = s.goals
    .filter((g) => s.wallets.some((w) => w.id === g.walletId && w.accessible))
    .reduce((n, g) => n + g.saved, 0);
  return {
    accessible,
    reserved: reserved + savings,
    safe: accessible - reserved - savings,
  };
}
export function validateTransaction(s: State, t: Transaction) {
  if (!Number.isSafeInteger(t.amount) || t.amount <= 0 || t.amount > 1e13)
    throw new Error(
      "Amount must be greater than zero and within the supported limit.",
    );
  if (!t.description.trim()) throw new Error("Add a description.");
  if (!validDate(t.date) || t.date > today())
    throw new Error("Use today or an earlier date for received or paid money.");
  const w = s.wallets.find((w) => w.id === t.walletId);
  if (!w || w.archived) throw new Error("Choose an active wallet.");
  if (t.type === "transfer") {
    const to = s.wallets.find((w) => w.id === t.toWalletId);
    if (!to || to.archived || to.id === w.id)
      throw new Error("Choose two different active wallets.");
    if (to.currency !== w.currency)
      throw new Error("Transfers require the same currency.");
  }
  if (t.type === "expense" && !s.categories.some((c) => c.id === t.categoryId))
    throw new Error("Choose a category.");
}
export function saveTransaction(s: State, t: Transaction): State {
  validateTransaction(s, t);
  const original = s.transactions.find((x) => x.id === t.id);
  if (
    original?.link &&
    JSON.stringify(original.link) !== JSON.stringify(t.link)
  )
    throw new Error("Keep this transaction linked to its planning record.");
  const linked = s.purchases.find((p) => p.expenseId === t.id);
  if (
    linked &&
    (t.type !== "expense" || t.categoryId !== linked.categoryId || t.reversed)
  )
    throw new Error(
      "A paid purchase must remain an expense in its original category.",
    );
  const next: State = {
    ...s,
    transactions: [...s.transactions.filter((x) => x.id !== t.id), t],
    purchases: s.purchases.map((p) =>
      p.expenseId === t.id ? { ...p, actual: t.amount } : p,
    ),
  };
  validateState(next);
  return next;
}
export function removeTransaction(
  s: State,
  id: string,
  reverse = false,
): State {
  const next: State = {
    ...s,
    transactions: reverse
      ? s.transactions.map((t) => (t.id === id ? { ...t, reversed: true } : t))
      : s.transactions.filter((t) => t.id !== id),
    purchases: s.purchases.map((p) =>
      p.expenseId === id
        ? { ...p, status: "purchased", expenseId: undefined }
        : p,
    ),
  };
  try {
    validateState(next);
  } catch {
    throw new Error(
      "Reverse or delete the repayments before removing the original loan.",
    );
  }
  return next;
}
export function payPurchase(
  s: State,
  id: string,
  walletId: string,
  amount: number,
  existingId?: string,
): State {
  const p = s.purchases.find((p) => p.id === id);
  if (!p) throw new Error("Purchase not found.");
  if (p.expenseId) return s;
  if (p.status === "cancelled")
    throw new Error("Restore this purchase before paying.");
  let next = s;
  let t: Transaction;
  if (existingId) {
    const existing = s.transactions.find((t) => t.id === existingId);
    if (
      !existing ||
      existing.reversed ||
      existing.type !== "expense" ||
      existing.link ||
      existing.categoryId !== p.categoryId ||
      s.purchases.some((p) => p.expenseId === existing.id)
    )
      throw new Error("Choose an unlinked expense in this category.");
    t = existing;
  } else {
    t = {
      id: uid(),
      type: "expense",
      walletId,
      categoryId: p.categoryId,
      amount,
      date: today(),
      description: p.name,
      notes: p.notes,
    };
    next = saveTransaction(s, t);
  }
  return {
    ...next,
    purchases: next.purchases.map((x) =>
      x.id === id
        ? { ...x, status: "paid", expenseId: t.id, actual: t.amount }
        : x,
    ),
  };
}
export function purchaseTotals(s: State, categoryId?: string) {
  return s.purchases
    .filter((p) => !categoryId || p.categoryId === categoryId)
    .reduce(
      (a, p) => {
        if (p.status === "planned") a.planned += p.estimate * p.quantity;
        if (p.status === "purchased")
          a.committed += p.actual || p.estimate * p.quantity;
        if (p.status === "paid") a.paid += p.actual;
        return a;
      },
      { planned: 0, committed: 0, paid: 0 },
    );
}
