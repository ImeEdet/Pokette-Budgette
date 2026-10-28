import { type State, emptyState, today, uid } from "../domain/model";
import { validateState, migrateState } from "../domain/validation";
export const STORAGE_KEY = "pokette.workspace.v1";
export function load(): State | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  let s: unknown;
  try {
    s = JSON.parse(raw);
  } catch {
    throw new Error(
      "Saved data is unreadable. Your stored data has not been changed.",
    );
  }
  return migrateState(s);
}
export function persist(s: State, backupLegacy = true) {
  validateState(s);
  const previous = localStorage.getItem(STORAGE_KEY);
  if (
    backupLegacy &&
    previous &&
    JSON.parse(previous).version === 1 &&
    !localStorage.getItem("pokette.backup.before-v2")
  ) {
    localStorage.setItem("pokette.backup.before-v2", previous);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
export function demoState(): State {
  const s = emptyState("demo");
  const bank = uid(),
    cash = uid();
  s.wallets = [
    {
      id: bank,
      name: "Everyday pocket",
      type: "Bank account",
      opening: 18500000,
      accessible: true,
      archived: false,
      currency: "NGN",
    },
    {
      id: cash,
      name: "Little cash stash",
      type: "Cash",
      opening: 1500000,
      accessible: true,
      archived: false,
      currency: "NGN",
    },
  ];
  s.categories = s.categories.map((c, i) => ({
    ...c,
    allocation: [2000000, 3500000, 2500000, 800000, 1200000, 1000000][i] ?? 0,
  }));
  s.transactions = [
    {
      id: uid(),
      type: "income",
      walletId: bank,
      amount: 7500000,
      date: today(),
      description: "Design project payment",
      notes: "Fictional demo income",
    },
    {
      id: uid(),
      type: "expense",
      walletId: cash,
      categoryId: s.categories[0].id,
      amount: 250000,
      date: today(),
      description: "A ride across town",
      notes: "",
    },
    {
      id: uid(),
      type: "expense",
      walletId: bank,
      categoryId: s.categories[1].id,
      amount: 650000,
      date: today(),
      description: "Lunch with a friend",
      notes: "",
    },
  ];
  s.purchases = [
    {
      id: uid(),
      categoryId: s.categories[2].id,
      name: "A little grocery restock",
      estimate: 1200000,
      actual: 0,
      quantity: 1,
      priority: "Medium",
      notes: "Fruit, oats, and the good biscuits",
      due: today(),
      status: "planned",
    },
  ];
  const incomeId = uid(),
    loanId = uid();
  s.incomes = [
    {
      id: incomeId,
      name: "Design project",
      amount: 10000000,
      due: today(),
      recurring: false,
      notes: "Fictional demo income",
    },
  ];
  s.transactions[0].link = { kind: "receipt", id: incomeId };
  s.loans = [
    {
      id: loanId,
      person: "Ada (demo)",
      direction: "lent",
      due: "",
      notes: "Fictional family support",
    },
  ];
  s.transactions.push(
    {
      id: uid(),
      type: "expense",
      walletId: bank,
      categoryId: s.categories[7].id,
      amount: 500000,
      date: today(),
      description: "Loan to Ada (demo)",
      notes: "",
      link: { kind: "principal", id: loanId },
    },
    {
      id: uid(),
      type: "income",
      walletId: bank,
      amount: 100000,
      date: today(),
      description: "Ada’s repayment (demo)",
      notes: "",
      link: { kind: "repayment", id: loanId },
    },
  );
  s.bills = [
    {
      id: uid(),
      name: "Music subscription (demo)",
      amount: 150000,
      categoryId: s.categories[3].id,
      walletId: bank,
      frequency: "monthly",
      interval: 1,
      nextDue: today(),
      anchorDay: Number(today().slice(-2)),
      active: true,
    },
  ];
  s.goals = [
    {
      id: uid(),
      name: "A little getaway",
      target: 10000000,
      saved: 1000000,
      walletId: bank,
      deadline: "",
      icon: "☆",
      color: "#DCC9F5",
    },
  ];
  return s;
}
