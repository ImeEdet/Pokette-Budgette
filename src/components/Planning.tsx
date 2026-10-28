import { useState, type FormEvent } from "react";
import {
  type State,
  type Bill,
  type Loan,
  type Goal,
  type ExpectedIncome,
  uid,
  today,
  colors,
} from "../domain/model";
import { moneyInput, balance } from "../domain/finance";
import {
  received,
  incomeStatus,
  loanTotals,
  recordMoney,
  generateBills,
  adjustGoal,
} from "../domain/planning";
import { validateState } from "../domain/validation";
import { Modal, Field } from "./Modal";
type Edit = {
  kind:
    | "bill"
    | "income"
    | "loan"
    | "goal"
    | "receipt"
    | "repayment"
    | "deposit"
    | "withdraw";
  id?: string;
};

export function Planning({
  s,
  save,
  format,
}: {
  s: State;
  save: (s: State) => boolean;
  format: (n: number) => string;
}) {
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState("");
  function change(next: State) {
    try {
      validateState(next);
      if (!save(next)) throw new Error("Could not save. Please try again.");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function history(id: string) {
    return (
      <details className="planning-history">
        <summary>Payment history</summary>
        {s.transactions
          .filter((t) => t.link?.id === id)
          .map((t) => (
            <p key={t.id}>
              {t.date} · {format(t.amount)} ·{" "}
              {s.wallets.find((w) => w.id === t.walletId)?.name}
              {t.link?.kind === "receipt"
                ? s.wallets.find((w) => w.id === t.walletId)?.accessible
                  ? " · Accessible"
                  : " · Inaccessible"
                : ""}
              {t.reversed ? " · Reversed" : ""}
            </p>
          ))}
        <p className="hint">Edit or reverse a payment in Transactions.</p>
      </details>
    );
  }
  return (
    <section className="planning-tools" aria-label="Planning tools">
      <h2>A little help planning ahead</h2>
      <p className="hint">
        Open just what you need. Your everyday payment list stays above.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <details className="budget-drawer">
        <summary>
          Subscriptions & recurring bills <small>{s.bills.length}</small>
        </summary>
        <p className="hint">
          Bills add unpaid items through the end of this month when you open
          Pokette. Payments always need your confirmation. Pausing stops future
          additions; existing items stay on your list.
        </p>
        <button
          className="button secondary"
          onClick={() => setEdit({ kind: "bill" })}
        >
          Add recurring bill
        </button>
        {s.bills.map((b) => (
          <article className="planning-card" key={b.id}>
            <h3>{b.name}</h3>
            <p>
              {format(b.amount)} ·{" "}
              {b.frequency === "custom"
                ? `Every ${b.interval} days`
                : b.frequency}{" "}
              · {b.active ? "Active" : "Paused"}
            </p>
            <p>
              Next addition: {b.nextDue} ·{" "}
              {s.wallets.find((w) => w.id === b.walletId)?.name}
            </p>
            <div className="inline-actions">
              <button
                className="button small"
                onClick={() => setEdit({ kind: "bill", id: b.id })}
              >
                Edit bill
              </button>
              <button
                className="button small"
                onClick={() =>
                  change({
                    ...s,
                    bills: s.bills.map((x) =>
                      x.id === b.id ? { ...x, active: !x.active } : x,
                    ),
                  })
                }
              >
                {b.active ? "Pause bill" : "Resume bill"}
              </button>
            </div>
          </article>
        ))}
      </details>
      <details className="budget-drawer">
        <summary>
          Money you’re expecting <small>{s.incomes.length}</small>
        </summary>
        <p className="hint">
          Promises are not cash. Record each part only when it arrives. Choose
          an inaccessible wallet if that money cannot be used yet.
        </p>
        <button
          className="button secondary"
          onClick={() => setEdit({ kind: "income" })}
        >
          Add expected income
        </button>
        {s.incomes.map((i) => (
          <article className="planning-card" key={i.id}>
            <h3>{i.name}</h3>
            <p>
              {incomeStatus(s, i.id)} · Expected {i.due}
              {i.recurring ? " · Recurring source" : ""}
            </p>
            <p>
              {format(received(s, i.id))} received of {format(i.amount)} ·{" "}
              {format(Math.max(0, i.amount - received(s, i.id)))} still expected
            </p>
            <div className="inline-actions">
              <button
                className="button small"
                onClick={() => setEdit({ kind: "receipt", id: i.id })}
              >
                Record receipt
              </button>
              <button
                className="button small"
                onClick={() => setEdit({ kind: "income", id: i.id })}
              >
                Edit expectation
              </button>
              {i.recurring && (
                <button
                  className="button small"
                  onClick={() => setEdit({ kind: "income" })}
                >
                  Plan next receipt
                </button>
              )}
            </div>
            {history(i.id)}
          </article>
        ))}
      </details>
      <details className="budget-drawer">
        <summary>
          People who owe me / Money I owe <small>{s.loans.length}</small>
        </summary>
        <p className="hint">
          Track debtors (people who owe you), money you borrowed, and gifts or
          family support here. Record money already sent or received. Loans and
          repayments affect your wallets, but are kept out of ordinary spending.
        </p>
        <button
          className="button secondary"
          onClick={() => setEdit({ kind: "loan" })}
        >
          Add loan or gift
        </button>
        {s.loans.map((l) => {
          const totals = loanTotals(s, l.id);
          const gift = l.direction.startsWith("gift");
          return (
            <article className="planning-card" key={l.id}>
              <h3>{l.person}</h3>
              <p>
                {
                  {
                    lent: "Money I lent · owed to me",
                    borrowed: "Money I borrowed · I owe",
                    "gift-given": "Gift I gave",
                    "gift-received": "Gift I received",
                  }[l.direction]
                }{" "}
                · {format(totals.principal)}
                {l.due ? ` · Due ${l.due}` : ""}
              </p>
              {!gift && (
                <p>
                  {totals.principal === 0
                    ? "Original payment removed"
                    : totals.outstanding === 0
                      ? "Settled ♡"
                      : `${format(totals.outstanding)} ${l.direction === "lent" ? "owed to you" : "still to repay"}`}{" "}
                  · {format(totals.repaid)} repaid
                </p>
              )}
              <div className="inline-actions">
                {!gift && totals.outstanding > 0 && (
                  <button
                    className="button small"
                    onClick={() => setEdit({ kind: "repayment", id: l.id })}
                  >
                    Record repayment
                  </button>
                )}
                <button
                  className="button small"
                  onClick={() => setEdit({ kind: "loan", id: l.id })}
                >
                  Edit details
                </button>
              </div>
              {history(l.id)}
            </article>
          );
        })}
      </details>
      <details className="budget-drawer">
        <summary>
          Savings goals <small>{s.goals.length}</small>
        </summary>
        <p className="hint">
          Set aside money already in a wallet. These goal allocations do not
          move cash or create expenses. Transfer money between accounts in
          Wallets first if needed.
        </p>
        <button
          className="button secondary"
          onClick={() => setEdit({ kind: "goal" })}
        >
          Create savings goal
        </button>
        {s.goals.map((g) => (
          <article
            className="planning-card"
            key={g.id}
            style={{ borderColor: g.color }}
          >
            <h3>
              {g.icon} {g.name}
            </h3>
            <p>
              {format(g.saved)} of {format(g.target)}
              {g.saved >= g.target ? " · Goal reached ♡" : ""}
            </p>
            <progress
              aria-label={`${g.name} progress`}
              value={Math.min(g.saved, g.target)}
              max={g.target}
            />
            <p>
              {s.wallets.find((w) => w.id === g.walletId)?.name}
              {g.deadline ? ` · By ${g.deadline}` : ""}
            </p>
            {s.goals
              .filter((x) => x.walletId === g.walletId)
              .reduce((n, x) => n + x.saved, 0) > balance(s, g.walletId) && (
              <p className="negative">
                This wallet now has less than its goal allocations. Release or
                reallocate some savings.
              </p>
            )}
            <div className="inline-actions">
              <button
                className="button small"
                onClick={() => setEdit({ kind: "deposit", id: g.id })}
              >
                Set money aside
              </button>
              <button
                className="button small"
                disabled={!g.saved}
                onClick={() => setEdit({ kind: "withdraw", id: g.id })}
              >
                Release or reallocate
              </button>
              <button
                className="button small"
                onClick={() => setEdit({ kind: "goal", id: g.id })}
              >
                Edit goal
              </button>
            </div>
          </article>
        ))}
      </details>
      {edit && (
        <PlanningEditor
          key={`${edit.kind}:${edit.id ?? "new"}`}
          s={s}
          edit={edit}
          save={save}
          close={() => setEdit(null)}
        />
      )}
    </section>
  );
}

function PlanningEditor({
  s,
  edit,
  save,
  close,
}: {
  s: State;
  edit: Edit;
  save: (s: State) => boolean;
  close: () => void;
}) {
  const [error, setError] = useState("");
  const [frequency, setFrequency] = useState<Bill["frequency"]>(
    s.bills.find((x) => x.id === edit.id)?.frequency ?? "monthly",
  );
  const [direction, setDirection] = useState<Loan["direction"]>(
    s.loans.find((x) => x.id === edit.id)?.direction ?? "lent",
  );
  const bill = s.bills.find((x) => x.id === edit.id),
    income = s.incomes.find((x) => x.id === edit.id),
    loan = s.loans.find((x) => x.id === edit.id),
    goal = s.goals.find((x) => x.id === edit.id);
  const titles = {
    bill: "Recurring bill",
    income: "Expected income",
    loan: "Loan or gift",
    goal: "Savings goal",
    receipt: "Record money received",
    repayment: "Record a repayment",
    deposit: "Set money aside",
    withdraw: "Release or reallocate savings",
  };
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (key: string) => String(f.get(key) ?? "").trim();
    const amount = (key = "amount") => {
      const n = moneyInput(str(key));
      if (n <= 0) throw new Error("Enter an amount greater than zero.");
      return n;
    };
    try {
      let next = s;
      const replace = <T extends { id: string }>(items: T[], item: T) =>
        items.some((x) => x.id === item.id)
          ? items.map((x) => (x.id === item.id ? item : x))
          : [...items, item];
      if (edit.kind === "bill") {
        const nextDue = str("due");
        const b: Bill = {
          id: bill?.id ?? uid(),
          name: str("name"),
          amount: amount(),
          categoryId: str("category"),
          walletId: str("wallet"),
          frequency,
          interval: Number(str("interval") || "1"),
          nextDue,
          anchorDay:
            bill && bill.nextDue === nextDue && bill.frequency === frequency
              ? bill.anchorDay
              : Number(nextDue.slice(-2)),
          active: bill?.active ?? true,
        };
        next = { ...s, bills: replace(s.bills, b) };
        validateState(next);
        next = generateBills(next);
      }
      if (edit.kind === "income") {
        const i: ExpectedIncome = {
          id: income?.id ?? uid(),
          name: str("name"),
          amount: amount(),
          due: str("due"),
          recurring: f.has("recurring"),
          notes: str("notes"),
        };
        next = { ...s, incomes: replace(s.incomes, i) };
      }
      if (edit.kind === "loan") {
        const l: Loan = {
          id: loan?.id ?? uid(),
          person: str("name"),
          direction,
          due: str("due"),
          notes: str("notes"),
        };
        next = { ...s, loans: replace(s.loans, l) };
        if (!loan)
          next = recordMoney(
            next,
            direction.startsWith("gift") ? "gift" : "principal",
            l.id,
            str("wallet"),
            amount(),
            str("date"),
            str("category") || undefined,
          );
      }
      if (edit.kind === "receipt" || edit.kind === "repayment")
        next = recordMoney(
          s,
          edit.kind === "receipt" ? "receipt" : "repayment",
          edit.id!,
          str("wallet"),
          amount(),
          str("date"),
        );
      if (edit.kind === "goal") {
        if (goal?.saved && goal.walletId !== str("wallet"))
          throw new Error(
            "Release or reallocate this goal’s savings before changing its wallet.",
          );
        const g: Goal = {
          id: goal?.id ?? uid(),
          name: str("name"),
          target: amount(),
          saved: goal?.saved ?? 0,
          walletId: str("wallet"),
          deadline: str("due"),
          icon: str("icon"),
          color: str("color"),
        };
        next = { ...s, goals: replace(s.goals, g) };
      }
      if (edit.kind === "deposit" || edit.kind === "withdraw")
        next = adjustGoal(
          s,
          edit.id!,
          amount(),
          edit.kind,
          str("destination") || undefined,
        );
      validateState(next);
      if (save(next)) close();
      else setError("Could not save. Your previous records are unchanged.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const moneyField = (value = 0, label = "Amount (₦)") => (
    <Field label={label}>
      <input
        name="amount"
        inputMode="decimal"
        defaultValue={value ? (value / 100).toFixed(2) : ""}
        placeholder="0.00"
        pattern="[0-9]+(\.[0-9]{1,2})?"
        required
      />
    </Field>
  );
  const walletField = (value?: string) => (
    <Field label="Wallet">
      <select name="wallet" defaultValue={value} required>
        <option value="">Choose a wallet</option>
        {s.wallets
          .filter((w) => !w.archived || w.id === value)
          .map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
              {!w.accessible ? " · inaccessible" : ""}
              {w.archived ? " · archived" : ""}
            </option>
          ))}
      </select>
    </Field>
  );
  const dateField = (
    name: string,
    label: string,
    value: string,
    required = false,
    max?: string,
  ) => (
    <Field label={label}>
      <input
        name={name}
        type="date"
        defaultValue={value}
        required={required}
        max={max}
      />
    </Field>
  );
  return (
    <Modal title={titles[edit.kind]} onClose={close}>
      <form onSubmit={submit}>
        {["bill", "income", "loan", "goal"].includes(edit.kind) && (
          <Field label={edit.kind === "loan" ? "Person" : "Name"}>
            <input
              name="name"
              defaultValue={
                bill?.name ?? income?.name ?? loan?.person ?? goal?.name
              }
              maxLength={100}
              required
              autoFocus
            />
          </Field>
        )}
        {edit.kind === "loan" && (
          <Field label="Kind">
            <select
              value={direction}
              disabled={!!loan}
              onChange={(e) =>
                setDirection(e.target.value as Loan["direction"])
              }
            >
              <option value="lent">Someone owes me · Money I lent</option>
              <option value="borrowed">I owe someone · Money I borrowed</option>
              <option value="gift-given">Gift I gave</option>
              <option value="gift-received">Gift I received</option>
            </select>
          </Field>
        )}
        {!(edit.kind === "loan" && loan) &&
          moneyField(
            bill?.amount ??
              (edit.kind === "income"
                ? income?.amount
                : edit.kind === "goal"
                  ? goal?.target
                  : undefined) ??
              0,
            edit.kind === "goal"
              ? "Target amount (₦)"
              : edit.kind === "income"
                ? "Expected amount (₦)"
                : "Amount (₦)",
          )}
        {["bill", "goal", "receipt", "repayment"].includes(edit.kind) ||
        (edit.kind === "loan" && !loan)
          ? walletField(bill?.walletId ?? goal?.walletId)
          : null}
        {edit.kind === "loan" && !loan && direction === "gift-given" && (
          <Field label="Gift category">
            <select
              name="category"
              defaultValue={
                s.categories.find(
                  (c) => c.name === "Family support" && !c.archived,
                )?.id
              }
              required
            >
              {s.categories
                .filter((c) => !c.archived)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        {edit.kind === "bill" && (
          <>
            <Field label="Category">
              <select name="category" defaultValue={bill?.categoryId} required>
                <option value="">Choose a category</option>
                {s.categories
                  .filter((c) => !c.archived || c.id === bill?.categoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Repeats">
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as Bill["frequency"])
                }
              >
                {["weekly", "monthly", "annual", "custom"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            {frequency === "custom" && (
              <Field label="Days between bills">
                <input
                  name="interval"
                  type="number"
                  min="1"
                  max="366"
                  defaultValue={bill?.interval ?? 30}
                  required
                />
              </Field>
            )}
            {dateField("due", "Next due date", bill?.nextDue ?? today(), true)}
            <p className="hint">
              Changes apply to future additions. Edit or cancel items already on
              your list separately.
            </p>
          </>
        )}
        {edit.kind === "income" && (
          <>
            {dateField("due", "Expected date", income?.due ?? today(), true)}
            <label className="check">
              <input
                name="recurring"
                type="checkbox"
                defaultChecked={income?.recurring}
              />{" "}
              This source pays me repeatedly
            </label>
            <p className="hint">
              Plan each expected receipt separately when you know its amount and
              date.
            </p>
          </>
        )}
        {(edit.kind === "receipt" ||
          edit.kind === "repayment" ||
          (edit.kind === "loan" && !loan)) &&
          dateField("date", "Payment date", today(), true, today())}
        {edit.kind === "loan" &&
          dateField("due", "Due date (optional)", loan?.due ?? "")}
        {edit.kind === "goal" && (
          <>
            {dateField("due", "Goal deadline (optional)", goal?.deadline ?? "")}
            <div className="form-grid">
              <Field label="Sticker">
                <select name="icon" defaultValue={goal?.icon ?? "☆"}>
                  {["☆", "♡", "✿", "⌂", "✧"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pastel accent">
                <select name="color" defaultValue={goal?.color ?? colors[0]}>
                  {colors.map((c, i) => (
                    <option key={c} value={c}>
                      {["Lavender", "Blush", "Sage", "Cream", "Peach"][i]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </>
        )}
        {edit.kind === "withdraw" && (
          <Field label="Where should this allocation go?">
            <select name="destination">
              <option value="">Release back to available money</option>
              {s.goals
                .filter((g) => g.id !== goal?.id)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        {["income", "loan"].includes(edit.kind) && (
          <Field label="Notes">
            <textarea
              name="notes"
              defaultValue={income?.notes ?? loan?.notes}
            />
          </Field>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="button primary">
            Save{" "}
            {edit.kind === "receipt" || edit.kind === "repayment"
              ? "payment"
              : "plan"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
