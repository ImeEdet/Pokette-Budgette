import { type State, today } from "./model";
import { isSpending, overview, spent } from "./finance";
import { validDate } from "./validation";
export function dateRange(preset: string, date = today()) {
  const [year, month] = date.split("-").map(Number);
  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const monthStart = (offset: number) => {
    const d = new Date(year, month - 1 + offset, 1, 12);
    return iso(d.getFullYear(), d.getMonth() + 1, 1);
  };
  if (preset === "last-month") {
    const d = new Date(year, month - 1, 0, 12);
    return {
      start: monthStart(-1),
      end: iso(d.getFullYear(), d.getMonth() + 1, d.getDate()),
    };
  }
  return {
    start:
      preset === "year"
        ? `${year}-01-01`
        : monthStart(preset === "three-months" ? -2 : 0),
    end: date,
  };
}
export function report(s: State, start: string, end: string) {
  if (!validDate(start) || !validDate(end) || start > end)
    throw new Error(
      "Choose a valid date range, with the start before the end.",
    );
  const within = (date: string) => date >= start && date <= end;
  const tx = s.transactions.filter((t) => !t.reversed && within(t.date));
  const ordinaryIncome = (t: State["transactions"][number]) =>
    t.type === "income" &&
    t.link?.kind !== "principal" &&
    t.link?.kind !== "repayment";
  const income = tx.filter(ordinaryIncome).reduce((n, t) => n + t.amount, 0),
    expenses = tx.filter(isSpending).reduce((n, t) => n + t.amount, 0);
  const cashFlow = tx
    .filter((t) => t.type !== "transfer")
    .reduce((n, t) => n + (t.type === "income" ? t.amount : -t.amount), 0);
  const months = new Map<
    string,
    { month: string; income: number; expenses: number }
  >();
  for (const t of tx) {
    const month = t.date.slice(0, 7);
    const row = months.get(month) ?? { month, income: 0, expenses: 0 };
    if (ordinaryIncome(t)) row.income += t.amount;
    if (isSpending(t)) row.expenses += t.amount;
    months.set(month, row);
  }
  const items = s.purchases.filter(
    (p) => p.status !== "cancelled" && p.due && within(p.due),
  );
  const categories = s.categories
    .map((c) => {
      const actual = tx
        .filter((t) => isSpending(t) && t.categoryId === c.id)
        .reduce((n, t) => n + t.amount, 0);
      return {
        id: c.id,
        name: c.name,
        color: c.color,
        actual,
        percentage: expenses ? (actual / expenses) * 100 : 0,
        planned: items
          .filter((p) => p.categoryId === c.id)
          .reduce((n, p) => n + p.estimate * p.quantity, 0),
      };
    })
    .filter((c) => c.actual || c.planned)
    .sort((a, b) => b.actual - a.actual);
  return {
    income,
    expenses,
    cashFlow,
    net: income - expenses,
    months: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)),
    categories,
    totals: overview(s),
    commitments: s.purchases.filter((p) => p.billId && p.due && within(p.due)),
    undated: s.purchases.filter((p) => !p.due && p.status !== "cancelled")
      .length,
    legacy: s.categories
      .filter((c) => c.allocation > 0 && c.start >= start && c.end <= end)
      .map((c) => ({ ...c, actual: spent(s, c) })),
  };
}
