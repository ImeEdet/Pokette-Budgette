import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Pencil,
  Undo2,
  Trash2,
} from "lucide-react";
import { type State, type Transaction } from "../domain/model";
export function TransactionList({
  s,
  items,
  format,
  edit,
  remove,
}: {
  s: State;
  items: Transaction[];
  format: (n: number) => string;
  edit: (t: Transaction) => void;
  remove: (t: Transaction, reverse: boolean) => void;
}) {
  if (!items.length)
    return (
      <div className="empty">
        A fresh little page! Your transactions will appear here.
      </div>
    );
  return (
    <div className="transactions">
      {items.map((t) => (
        <div
          className={`transaction ${t.reversed ? "reversed" : ""}`}
          key={t.id}
        >
          <span className={`transaction-icon ${t.type}`}>
            {t.type === "income" ? (
              <ArrowDownLeft size={20} />
            ) : t.type === "expense" ? (
              <ArrowUpRight size={20} />
            ) : (
              <ArrowLeftRight size={20} />
            )}
          </span>
          <div className="transaction-description">
            <strong>{t.description}</strong>
            <small>
              {s.wallets.find((w) => w.id === t.walletId)?.name}
              {t.type === "transfer"
                ? " → " + s.wallets.find((w) => w.id === t.toWalletId)?.name
                : " · " +
                  (t.link?.kind === "principal" || t.link?.kind === "repayment"
                    ? "Loans"
                    : (s.categories.find((c) => c.id === t.categoryId)?.name ??
                      "Income"))}{" "}
              · {t.date}
              {t.link
                ? ` · ${t.link.kind === "principal" ? "Loan" : t.link.kind === "repayment" ? "Loan repayment" : t.link.kind === "gift" ? "Gift" : "Income receipt"}`
                : ""}
              {t.reversed ? " · Reversed" : ""}
            </small>
            {t.notes && <small>{t.notes}</small>}
          </div>
          <strong className={t.type === "income" ? "positive" : ""}>
            {t.type === "income" ? "+" : t.type === "expense" ? "−" : ""}
            {format(t.amount)}
          </strong>
          <div className="row-actions">
            {!t.reversed && (
              <>
                <button
                  className="icon-button"
                  aria-label={`Edit ${t.description}`}
                  onClick={() => edit(t)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Reverse ${t.description}`}
                  onClick={() => remove(t, true)}
                >
                  <Undo2 size={15} />
                </button>
              </>
            )}
            <button
              className="icon-button"
              aria-label={`Delete ${t.description}`}
              onClick={() => remove(t, false)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
