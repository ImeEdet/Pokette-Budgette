import {
  type State,
  type Bill,
  type Transaction,
  today,
  uid,
  periodDates,
} from "./model";
import { balance, saveTransaction } from "./finance";
import { validateState, validDate } from "./validation";

export function received(s: State, id: string) {
  return s.transactions
    .filter(
      (t) => !t.reversed && t.link?.kind === "receipt" && t.link.id === id,
    )
    .reduce((n, t) => n + t.amount, 0);
}
export function incomeStatus(s: State, id: string) {
  const i = s.incomes.find((i) => i.id === id)!;
  const amount = received(s, id);
  return amount >= i.amount
    ? "Received"
    : amount > 0
      ? "Partially received"
      : i.due < today()
        ? "Overdue"
        : "Expected";
}
export function loanTotals(s: State, id: string) {
  const ts = s.transactions.filter(
    (t) => !t.reversed && t.link?.id === id && t.link.kind !== "receipt",
  );
  const principal = ts
    .filter((t) => t.link?.kind !== "repayment")
    .reduce((n, t) => n + t.amount, 0);
  const repaid = ts
    .filter((t) => t.link?.kind === "repayment")
    .reduce((n, t) => n + t.amount, 0);
  return { principal, repaid, outstanding: principal - repaid };
}
export function recordMoney(
  s: State,
  kind: NonNullable<Transaction["link"]>["kind"],
  id: string,
  walletId: string,
  amount: number,
  date: string,
  categoryId?: string,
): State {
  const loan = s.loans.find((l) => l.id === id);
  const income = s.incomes.find((i) => i.id === id);
  if (kind === "receipt" ? !income : !loan)
    throw new Error("This record could not be found.");
  if (kind === "repayment" && amount > loanTotals(s, id).outstanding)
    throw new Error("Repayment cannot exceed the amount still owed.");
  const incoming =
    kind === "receipt" ||
    (kind === "repayment"
      ? loan?.direction === "lent"
      : ["borrowed", "gift-received"].includes(loan!.direction));
  const t: Transaction = {
    id: uid(),
    type: incoming ? "income" : "expense",
    walletId,
    categoryId: incoming
      ? undefined
      : (categoryId ??
        s.categories.find((c) => !c.archived && c.name === "Family support")
          ?.id ??
        s.categories.find((c) => !c.archived)?.id),
    amount,
    date,
    description:
      kind === "receipt"
        ? income!.name
        : `${kind === "repayment" ? "Repayment" : loan!.direction.startsWith("gift") ? "Gift" : "Loan"} · ${loan!.person}`,
    notes: income?.notes ?? loan?.notes ?? "",
    link: { kind, id },
  };
  return saveTransaction(s, t);
}

function dateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function advanceBill(b: Bill): string {
  const d = new Date(b.nextDue + "T12:00:00");
  if (b.frequency === "weekly" || b.frequency === "custom")
    d.setDate(d.getDate() + (b.frequency === "weekly" ? 7 : b.interval));
  else {
    d.setDate(1);
    d.setMonth(d.getMonth() + (b.frequency === "monthly" ? 1 : 12));
    d.setDate(
      Math.min(
        b.anchorDay,
        new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
      ),
    );
  }
  return dateString(d);
}
export function generateBills(
  s: State,
  through = periodDates("monthly").end,
): State {
  if (!validDate(through)) throw new Error("Choose a valid schedule date.");
  let changed = false;
  const purchases = [...s.purchases];
  const bills = s.bills.map((original) => {
    let b = { ...original };
    let count = 0;
    while (b.active && b.nextDue <= through) {
      if (++count > 5000)
        throw new Error(
          "This schedule starts too far in the past. Choose a more recent next due date.",
        );
      const id = `bill:${b.id}:${b.nextDue}`;
      if (!purchases.some((p) => p.id === id))
        purchases.push({
          id,
          billId: b.id,
          categoryId: b.categoryId,
          name: b.name,
          estimate: b.amount,
          actual: 0,
          quantity: 1,
          priority: "Medium",
          notes: "Recurring bill",
          due: b.nextDue,
          status: "planned",
        });
      const nextDue = advanceBill(b);
      if (!validDate(nextDue) || nextDue <= b.nextDue)
        throw new Error("This schedule is outside the supported date range.");
      b = { ...b, nextDue };
      changed = true;
    }
    return b;
  });
  return changed ? { ...s, bills, purchases } : s;
}
export function adjustGoal(
  s: State,
  id: string,
  amount: number,
  direction: "deposit" | "withdraw",
  destination?: string,
): State {
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new Error("Enter an amount greater than zero.");
  const g = s.goals.find((g) => g.id === id);
  if (!g) throw new Error("Goal not found.");
  if (direction === "withdraw" && amount > g.saved)
    throw new Error("You cannot release more than you have set aside.");
  if (
    destination &&
    (destination === id || !s.goals.some((x) => x.id === destination))
  )
    throw new Error("Choose a different goal.");
  const goals = s.goals.map((x) =>
    x.id === id
      ? { ...x, saved: x.saved + (direction === "deposit" ? amount : -amount) }
      : x.id === destination
        ? { ...x, saved: x.saved + amount }
        : x,
  );
  const target = destination
    ? goals.find((x) => x.id === destination)!
    : goals.find((x) => x.id === id)!;
  if (direction === "deposit" || destination) {
    const wallet = s.wallets.find((w) => w.id === target.walletId);
    if (!wallet || wallet.archived)
      throw new Error("Choose an active wallet for this goal.");
    if (
      goals
        .filter((x) => x.walletId === target.walletId)
        .reduce((n, x) => n + x.saved, 0) > balance(s, target.walletId)
    )
      throw new Error(
        "There is not enough money in that wallet to set this amount aside.",
      );
  }
  const next = { ...s, goals };
  validateState(next);
  return next;
}
