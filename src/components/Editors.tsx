import { useState, type FormEvent } from "react";
import {
  type State,
  type Wallet,
  type Category,
  type Transaction,
  type Purchase,
  uid,
  today,
  periodDates,
  colors,
} from "../domain/model";
import { moneyInput, payPurchase, saveTransaction } from "../domain/finance";
import { Modal, Field } from "./Modal";
export type Editor =
  | { kind: "wallet"; item?: Wallet; firstSetup?: boolean }
  | { kind: "category"; item?: Category }
  | {
      kind: "transaction";
      item?: Transaction;
      type?: Transaction["type"];
      walletId?: string;
    }
  | { kind: "purchase"; item?: Purchase; categoryId?: string; due?: string }
  | { kind: "pay"; item: Purchase };
export function Editors({
  editor,
  s,
  save,
  close,
}: {
  editor: Editor;
  s: State;
  save: (s: State) => boolean;
  close: () => void;
}) {
  const [error, setError] = useState("");
  const [txType, setTxType] = useState(
    editor.kind === "transaction"
      ? (editor.item?.type ?? editor.type ?? "expense")
      : "expense",
  );
  const [period, setPeriod] = useState(
    editor.kind === "category" ? (editor.item?.period ?? "monthly") : "monthly",
  );
  const [link, setLink] = useState("");
  const item = editor.item;
  const wallets = s.wallets.filter((w) => !w.archived);
  const cats = s.categories.filter(
    (c) =>
      !c.archived ||
      ("categoryId" in (item ?? {}) && (item as Purchase).categoryId === c.id),
  );
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const str = (k: string) => String(data.get(k) ?? "").trim();
    const amount = (k: string, signed = false) =>
      moneyInput(str(k) || "0", signed);
    try {
      let next = s;
      if (
        ["wallet", "category", "purchase"].includes(editor.kind) &&
        !str("name")
      )
        throw new Error("Enter a name, not just spaces.");
      if (editor.kind === "wallet") {
        const w: Wallet = {
          id: editor.item?.id ?? uid(),
          name: str("name"),
          type: str("type"),
          opening: amount("opening", true),
          currency: "NGN",
          accessible: data.has("accessible"),
          archived: editor.item?.archived ?? false,
        };
        next = {
          ...s,
          wallets: [...s.wallets.filter((x) => x.id !== w.id), w],
        };
      }
      if (editor.kind === "category") {
        const dates =
          period === "custom"
            ? { start: str("start"), end: str("end") }
            : periodDates(period, str("start"));
        if (dates.end < dates.start)
          throw new Error("End date must be on or after the start date.");
        const c: Category = {
          id: editor.item?.id ?? uid(),
          name: str("name"),
          icon: str("icon"),
          color: str("color"),
          allocation: amount("allocation"),
          period,
          ...dates,
          notes: str("notes"),
          archived: editor.item?.archived ?? false,
        };
        next = {
          ...s,
          categories: editor.item
            ? s.categories.map((x) => (x.id === c.id ? c : x))
            : [...s.categories, c],
        };
      }
      if (editor.kind === "transaction") {
        const t: Transaction = {
          ...editor.item,
          id: editor.item?.id ?? uid(),
          type: txType,
          walletId: str("walletId"),
          toWalletId: txType === "transfer" ? str("toWalletId") : undefined,
          categoryId: txType === "expense" ? str("categoryId") : undefined,
          amount: amount("amount"),
          date: str("date"),
          description: str("description"),
          notes: str("notes"),
        };
        next = saveTransaction(s, t);
      }
      if (editor.kind === "purchase") {
        const quantity = Number(str("quantity"));
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000)
          throw new Error("Quantity must be a whole number from 1 to 10,000.");
        const estimate = amount("estimate");
        if (estimate * quantity > 1e13)
          throw new Error("Estimated total is too large.");
        const p: Purchase = {
          id: editor.item?.id ?? uid(),
          name: str("name"),
          categoryId: str("categoryId"),
          estimate,
          actual: amount("actual"),
          quantity,
          priority: str("priority"),
          due: str("due"),
          status: str("status") as Purchase["status"],
          notes: str("notes"),
        };
        next = {
          ...s,
          purchases: editor.item
            ? s.purchases.map((x) => (x.id === p.id ? p : x))
            : [...s.purchases, p],
        };
      }
      if (editor.kind === "pay")
        next = payPurchase(
          s,
          editor.item.id,
          str("walletId"),
          link ? 0 : amount("amount"),
          link || undefined,
        );
      if (save(next)) close();
      else
        setError(
          "This change could not be saved. Check device storage and try again.",
        );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const walletSelect = (name = "walletId", value?: string) => (
    <Field label={name === "toWalletId" ? "To wallet" : "Wallet"}>
      <select
        name={name}
        defaultValue={
          value && wallets.some((w) => w.id === value)
            ? value
            : value
              ? ""
              : wallets[0]?.id
        }
        required
      >
        {value && !wallets.some((w) => w.id === value) && (
          <option value="">Choose an active wallet</option>
        )}
        {wallets.length === 0 && (
          <option value="">Create a wallet first</option>
        )}
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </Field>
  );
  const categorySelect = (value?: string) => (
    <Field label="Category">
      <select name="categoryId" defaultValue={value ?? cats[0]?.id} required>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </Field>
  );
  const moneyField = (
    label: string,
    name: string,
    value = 0,
    signed = false,
  ) => (
    <Field label={label}>
      <input
        name={name}
        inputMode="decimal"
        defaultValue={(value / 100).toFixed(2)}
        pattern={signed ? "-?[0-9]+(\\.[0-9]{1,2})?" : "[0-9]+(\\.[0-9]{1,2})?"}
        required
      />
    </Field>
  );
  return (
    <Modal
      title={
        editor.kind === "wallet" && editor.firstSetup
          ? "Create your first wallet"
          : editor.kind === "pay"
            ? "Make it paid ♡"
            : editor.kind === "purchase"
              ? item
                ? "Edit your plan"
                : "Add something to pay"
              : `${item ? "Edit" : "New"} ${editor.kind}`
      }
      onClose={close}
    >
      <form onSubmit={submit}>
        {editor.kind === "wallet" && (
          <>
            {editor.firstSetup && (
              <p className="hint">
                Add a bank account or cash so Pokette knows your starting point.
                Enter the balance you have now. You can add more wallets later.
              </p>
            )}
            <Field label="Wallet name">
              <input
                name="name"
                defaultValue={editor.item?.name}
                maxLength={60}
                required
                autoFocus
              />
            </Field>
            <div className="form-grid">
              <Field label="Type">
                <select name="type" defaultValue={editor.item?.type}>
                  {[
                    "Bank account",
                    "Cash",
                    "Digital wallet",
                    "Savings account",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              {moneyField(
                "Opening balance (₦)",
                "opening",
                editor.item?.opening,
                true,
              )}
            </div>
            <p className="hint">
              Currency: Nigerian naira (NGN). Opening balance is the amount
              before recorded transactions.
            </p>
            <label className="check">
              <input
                type="checkbox"
                name="accessible"
                defaultChecked={editor.item?.accessible ?? true}
              />{" "}
              Include in accessible money
            </label>
          </>
        )}
        {editor.kind === "category" && (
          <>
            <Field label="Category name">
              <input
                name="name"
                defaultValue={editor.item?.name}
                maxLength={60}
                required
                autoFocus
              />
            </Field>
            <div className="form-grid">
              <Field label="Sticker">
                <select name="icon" defaultValue={editor.item?.icon ?? "☆"}>
                  {["↗", "♡", "✿", "♫", "☀", "✧", "⌘", "⌂", "✚", "☆", "⋯"].map(
                    (i) => (
                      <option key={i}>{i}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Pastel accent">
                <select
                  name="color"
                  defaultValue={editor.item?.color ?? colors[0]}
                >
                  {colors.map((c, i) => (
                    <option key={c} value={c}>
                      {["Lavender", "Blush", "Sage", "Cream", "Peach"][i]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <details className="budget-drawer">
              <summary>Previous category limits (optional)</summary>
              <div className="form-grid">
                {moneyField(
                  "Budget allocation (₦)",
                  "allocation",
                  editor.item?.allocation,
                )}
                <Field label="Budget period">
                  <select
                    value={period}
                    onChange={(e) =>
                      setPeriod(e.target.value as Category["period"])
                    }
                  >
                    {["monthly", "weekly", "custom"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={
                    period === "custom" ? "Start date" : "Date within period"
                  }
                >
                  <input
                    name="start"
                    type="date"
                    defaultValue={editor.item?.start ?? today()}
                    required
                  />
                </Field>
                {period === "custom" && (
                  <Field label="End date">
                    <input
                      name="end"
                      type="date"
                      defaultValue={editor.item?.end ?? today()}
                      required
                    />
                  </Field>
                )}
              </div>
              <p className="hint">
                The remaining allocation is reserved during this period. Planned
                items are included in your plan, not reserved a second time.
              </p>
            </details>
            <Field label="Notes">
              <textarea name="notes" defaultValue={editor.item?.notes} />
            </Field>
          </>
        )}
        {editor.kind === "transaction" && (
          <>
            <Field label="Transaction type">
              <select
                value={txType}
                disabled={!!editor.item?.link}
                onChange={(e) =>
                  setTxType(e.target.value as Transaction["type"])
                }
              >
                {["income", "expense", "transfer"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <input
                name="description"
                defaultValue={editor.item?.description}
                maxLength={100}
                required
                autoFocus
              />
            </Field>
            <div className="form-grid">
              {moneyField("Amount (₦)", "amount", editor.item?.amount)}
              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  defaultValue={editor.item?.date ?? today()}
                  max={today()}
                  required
                />
              </Field>
              {walletSelect(
                "walletId",
                editor.item?.walletId ?? editor.walletId,
              )}
              {txType === "transfer"
                ? walletSelect(
                    "toWalletId",
                    editor.item?.toWalletId ?? wallets[1]?.id,
                  )
                : txType === "expense" &&
                  categorySelect(editor.item?.categoryId)}
            </div>
            <Field label="Notes">
              <textarea name="notes" defaultValue={editor.item?.notes} />
            </Field>
            <p className="hint">
              Record money already received or paid. Negative wallet balances
              are allowed and clearly shown.
            </p>
          </>
        )}
        {editor.kind === "purchase" && (
          <>
            <Field label="What are you paying for?">
              <input
                name="name"
                defaultValue={editor.item?.name}
                maxLength={100}
                placeholder="e.g. Spotify, NEPA, groceries"
                required
                autoFocus
              />
            </Field>
            {categorySelect(editor.item?.categoryId ?? editor.categoryId)}
            {moneyField(
              "Estimated amount (₦)",
              "estimate",
              editor.item?.estimate,
            )}
            <p className="hint">
              A rough estimate is fine. You’ll enter the actual amount when you
              pay.
            </p>
            <details className="budget-drawer">
              <summary>More details (optional)</summary>
              <div className="form-grid">
                <Field label="Quantity (estimate is per item)">
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="10000"
                    step="1"
                    defaultValue={editor.item?.quantity ?? 1}
                    required
                  />
                </Field>
                {moneyField(
                  "Actual total, if known (₦)",
                  "actual",
                  editor.item?.actual,
                )}
                <Field label="Priority">
                  <select
                    name="priority"
                    defaultValue={editor.item?.priority ?? "Medium"}
                  >
                    {["Low", "Medium", "High"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Due date (optional)">
                  <input
                    name="due"
                    type="date"
                    defaultValue={editor.item?.due ?? editor.due ?? today()}
                  />
                </Field>
                <Field label="Status">
                  <select
                    name="status"
                    defaultValue={editor.item?.status ?? "planned"}
                  >
                    {["planned", "purchased", "cancelled"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Notes">
                <textarea name="notes" defaultValue={editor.item?.notes} />
              </Field>
            </details>
          </>
        )}
        {editor.kind === "pay" && (
          <>
            <p>
              Record payment for <strong>{editor.item.name}</strong>.
            </p>
            <Field label="Payment record">
              <select value={link} onChange={(e) => setLink(e.target.value)}>
                <option value="">Create a new expense</option>
                {s.transactions
                  .filter(
                    (t) =>
                      t.type === "expense" &&
                      !t.link &&
                      !t.reversed &&
                      t.categoryId === editor.item.categoryId &&
                      !s.purchases.some((p) => p.expenseId === t.id),
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.description} · ₦{(t.amount / 100).toFixed(2)}
                    </option>
                  ))}
              </select>
            </Field>
            {!link && (
              <>
                {walletSelect(
                  "walletId",
                  s.bills.find((b) => b.id === editor.item.billId)?.walletId,
                )}
                {moneyField(
                  "Actual total paid (₦)",
                  "amount",
                  editor.item.actual ||
                    editor.item.estimate * editor.item.quantity,
                )}
              </>
            )}
            <p className="hint">
              This links exactly one expense to your purchase.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <footer>
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            {editor.kind === "pay"
              ? "Confirm payment"
              : editor.kind === "purchase"
                ? "Save item"
                : "Save " + editor.kind}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
