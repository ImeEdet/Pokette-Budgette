export type Wallet = {
  id: string;
  name: string;
  type: string;
  opening: number;
  accessible: boolean;
  archived: boolean;
  currency: "NGN";
};
export type Transaction = {
  id: string;
  type: "income" | "expense" | "transfer";
  walletId: string;
  toWalletId?: string;
  categoryId?: string;
  amount: number;
  date: string;
  description: string;
  notes: string;
  reversed?: boolean;
  link?: { kind: "receipt" | "principal" | "repayment" | "gift"; id: string };
};
export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  allocation: number;
  start: string;
  end: string;
  period: "monthly" | "weekly" | "custom";
  notes: string;
  archived: boolean;
};
export type Purchase = {
  id: string;
  categoryId: string;
  name: string;
  estimate: number;
  actual: number;
  quantity: number;
  priority: string;
  notes: string;
  due: string;
  status: "planned" | "purchased" | "paid" | "cancelled";
  expenseId?: string;
  billId?: string;
};
export type ExpectedIncome = {
  id: string;
  name: string;
  amount: number;
  due: string;
  recurring: boolean;
  notes: string;
};
export type Loan = {
  id: string;
  person: string;
  direction: "lent" | "borrowed" | "gift-given" | "gift-received";
  due: string;
  notes: string;
};
export type Bill = {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  walletId: string;
  frequency: "weekly" | "monthly" | "annual" | "custom";
  interval: number;
  nextDue: string;
  anchorDay: number;
  active: boolean;
};
export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  walletId: string;
  deadline: string;
  icon: string;
  color: string;
};
export type State = {
  version: 2;
  mode: "fresh" | "demo";
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  purchases: Purchase[];
  incomes: ExpectedIncome[];
  loans: Loan[];
  bills: Bill[];
  goals: Goal[];
};
export const uid = () => crypto.randomUUID();
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function periodDates(period: string, date = today()) {
  const d = new Date(date + "T12:00:00");
  if (period === "weekly") {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const start = localDate(d);
    d.setDate(d.getDate() + 6);
    return { start, end: localDate(d) };
  }
  return {
    start: date.slice(0, 7) + "-01",
    end: localDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  };
}
function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const colors = ["#DCC9F5", "#F8CBDD", "#C8E5CE", "#FFF2D9", "#FFD5B7"];
export function emptyState(mode: State["mode"] = "fresh"): State {
  return {
    version: 2,
    incomes: [],
    loans: [],
    bills: [],
    goals: [],
    mode,
    wallets: [],
    transactions: [],
    purchases: [],
    categories: [
      "Transportation",
      "Food and meals",
      "Groceries and treats",
      "Subscriptions",
      "Electricity and utilities",
      "Personal essentials",
      "Technology and repairs",
      "Family support",
      "Emergency fund",
      "Savings",
      "Miscellaneous",
    ].map((name, i) => ({
      id: uid(),
      name,
      icon: ["↗", "♡", "✿", "♫", "☀", "✧", "⌘", "⌂", "✚", "☆", "⋯"][i],
      color: colors[i % 5],
      allocation: 0,
      ...periodDates("monthly"),
      period: "monthly",
      notes: "",
      archived: false,
    })),
  };
}
