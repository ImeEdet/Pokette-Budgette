import { useState, type ReactNode } from "react";
import { type State, type Purchase, today } from "../domain/model";
export function BudgetList({
  s,
  format,
  add,
  expense,
  renderItems,
}: {
  s: State;
  format: (amount: number) => string;
  add: (month: string) => void;
  expense: () => void;
  renderItems: (items: Purchase[]) => ReactNode;
}) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const items = s.purchases.filter(
    (p) => !month || !p.due || p.due.startsWith(month),
  );
  const unpaid = items.filter(
    (p) => p.status === "planned" || p.status === "purchased",
  );
  const finished = items.filter(
    (p) => p.status === "paid" || p.status === "cancelled",
  );
  const overdue = s.purchases.filter(
    (p) =>
      month &&
      p.due &&
      p.due.slice(0, 7) < month &&
      (p.status === "planned" || p.status === "purchased"),
  );
  function groups(list: Purchase[]) {
    return s.categories.map((c) => {
      const group = list.filter((p) => p.categoryId === c.id);
      return group.length ? (
        <section className="panel budget-item-group" key={c.id}>
          <h3>
            <span aria-hidden="true">{c.icon}</span> {c.name}
            {c.archived ? " · Archived category" : ""}
          </h3>
          {renderItems(group)}
        </section>
      ) : null;
    });
  }
  return (
    <div className="budget-focus">
      <section className="budget-summary">
        <span className="handwritten">one little plan at a time ♡</span>
        <h2>What would you like to pay for?</h2>
        <p>
          Spotify, NEPA, groceries… add each thing to your list. Categories
          simply keep similar things together.
        </p>
        <div className="budget-list-controls">
          <label className="field">
            <span>Plan month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <button className="text-button" onClick={() => setMonth("")}>
            All dates
          </button>
        </div>
        <dl>
          <div>
            <dt>Still to pay · estimate</dt>
            <dd>
              {format(
                unpaid.reduce(
                  (n, p) => n + (p.actual || p.estimate * p.quantity),
                  0,
                ),
              )}
            </dd>
          </div>
          <div>
            <dt>Paid on this list</dt>
            <dd>
              {format(
                finished
                  .filter((p) => p.status === "paid")
                  .reduce((n, p) => n + p.actual, 0),
              )}
            </dd>
          </div>
        </dl>
        <button
          className="button primary budget-add"
          onClick={() => add(month)}
        >
          Add something to pay
        </button>
      </section>
      <p className="budget-explainer">
        Not sure of the exact cost? An estimate is enough. You can enter the
        real amount when you mark it paid. Items without dates stay visible in
        every month.
      </p>
      {!unpaid.length && (
        <div className="empty">
          <h3>
            {finished.length
              ? "All caught up ♡"
              : "Your list can start with just one thing."}
          </h3>
          <p>Add something you plan to pay for this month.</p>
        </div>
      )}
      {groups(unpaid)}
      {overdue.length > 0 && (
        <details className="budget-drawer">
          <summary>Still unpaid from earlier months · {overdue.length}</summary>
          {groups(overdue)}
        </details>
      )}
      {finished.length > 0 && (
        <details className="budget-drawer">
          <summary>Paid & cancelled · {finished.length}</summary>
          {groups(finished)}
        </details>
      )}
      <div className="budget-spontaneous">
        <p>
          Already spent money on something you hadn’t planned? You don’t have to
          create a budget item first.
        </p>
        <button className="button secondary" onClick={expense}>
          Record an expense
        </button>
      </div>
      <p className="hint">
        Unpaid items across all dates are set aside in safe-to-spend. Your
        wallet balance changes only when you record a payment. Cancelled items
        are not set aside.
      </p>
    </div>
  );
}
