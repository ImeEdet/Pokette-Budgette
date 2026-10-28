import { lazy, Suspense, useState } from "react";
import {
  LayoutDashboard,
  Wallet as WalletIcon,
  Shapes,
  ArrowLeftRight,
  MoreHorizontal,
  Plus,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ArrowLeft,
  Heart,
  Search,
  Archive,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  Clock3,
  X,
  Trash2,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  type State,
  type Transaction,
  type Category,
  type Purchase,
  emptyState,
  today,
} from "./domain/model";
import {
  balance,
  money,
  overview,
  spent,
  removeTransaction,
  isSpending,
} from "./domain/finance";
import { useWorkspace } from "./data/useWorkspace";

import { Editors, type Editor } from "./components/Editors";
import { Modal } from "./components/Modal";
import { TransactionList } from "./components/TransactionList";
import { useNavigation } from "./navigation/useNavigation";
import { useOffline } from "./pwa/useOffline";
import {
  OfflinePanel,
  OfflineStatus,
  UpdateNotice,
} from "./components/OfflinePanel";
import { BudgetList } from "./components/BudgetList";
import { Planning } from "./components/Planning";
import { BeginnerGuide } from "./components/BeginnerGuide";
import { Appearance } from "./components/Appearance";
import { DataPrivacy } from "./components/DataPrivacy";
import { useDashboardStyle } from "./data/preferences";
const Reports = lazy(() => import("./components/Reports"));

const pageTitles: Record<string, string> = {
  Wallets: "Your little pockets",
  Budget: "Your budget, made simple",
  Transactions: "The money diary",
  More: "A few little details",
  Reports: "Your money, a little clearer",
};
const nav = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Wallets", icon: WalletIcon },
  { name: "Budget", icon: Shapes },
  { name: "Transactions", icon: ArrowLeftRight },
  { name: "More", icon: MoreHorizontal },
];
export default function App() {
  const dashboardStyle = useDashboardStyle();
  const {
    state: s,
    commit,
    error,
    blocked,
    inDemo,
    enterDemo,
    restoreDemo,
    exitDemo,
    clearRecords,
  } = useWorkspace();
  const { page, detail, go } = useNavigation();
  const offline = useOffline();
  const setDetail = (id: string | null) => go(page, id);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [firstWallet, setFirstWallet] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [actionError, setActionError] = useState("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    text: string;
    action: () => void;
  } | null>(null);
  const fmt = (n: number) => (hidden ? "••••••" : money(n));
  function navigate(name: string, id: string | null = null) {
    go(name, id);
    setQuery("");
    setFilter("all");
    setWalletFilter("all");
    setShowArchived(false);
  }
  function ask(title: string, text: string, action: () => void) {
    setConfirm({ title, text, action });
  }
  if (!s)
    return (
      <main className="welcome">
        <div className="welcome-doodle" aria-hidden="true">
          ✦ ♡ ✧
        </div>
        <span className="eyebrow">YOUR LITTLE MONEY CORNER</span>
        <h1>
          pokette
          <br />
          budgette<span>♡</span>
        </h1>
        <p className="handwritten">Little plans, big dreams.</p>
        <p>
          A little space for your pockets, your plans,
          <br />
          and everything you’re dreaming of.
        </p>
        <section className="welcome-card">
          <NotebookPen size={32} />
          <h2>Let’s turn a fresh page.</h2>
          <p>Make room for money clarity, one little step at a time.</p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            disabled={blocked}
            className="button primary"
            onClick={() => {
              if (commit(emptyState())) {
                navigate("Wallets");
                setFirstWallet(true);
                setEditor({ kind: "wallet", firstSetup: true });
              }
            }}
          >
            Start Fresh <ArrowUpRight size={18} />
          </button>
          <button
            disabled={blocked}
            className="button secondary"
            onClick={() => {
              enterDemo();
              navigate("Dashboard");
            }}
          >
            Explore Demo
          </button>
          <small>Demo contains fictional sample data.</small>
        </section>
        <p className="privacy">
          Just you and your browser. No account needed.
          <br />
          Stored on this device; no automatic sync between devices.
        </p>
        <OfflineStatus offline={offline} />
      </main>
    );
  const totals = overview(s);

  const category =
    page === "Budget" ? s.categories.find((c) => c.id === detail) : undefined;
  const wallet =
    page === "Wallets" ? s.wallets.find((w) => w.id === detail) : undefined;
  const recent = [...s.transactions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const periodExpenses = s.transactions.filter(
    (t) =>
      !t.reversed && isSpending(t) && t.date.startsWith(today().slice(0, 7)),
  );
  const chart = s.categories
    .map((c) => ({
      name: c.name,
      value: periodExpenses
        .filter((t) => t.categoryId === c.id)
        .reduce((a, t) => a + t.amount, 0),
      color: c.color,
    }))
    .filter((c) => c.value > 0);
  const monthlyTotal = chart.reduce((a, c) => a + c.value, 0);
  const editTransaction = (t: Transaction) =>
    setEditor({ kind: "transaction", item: t });
  const remove = (t: Transaction, reverse: boolean) =>
    ask(
      reverse ? "Reverse this transaction?" : "Delete this transaction?",
      `This updates the wallet balance${s.purchases.some((p) => p.expenseId === t.id) ? " and marks the linked purchase as unpaid" : ""}. ${reverse ? "The original record remains visible." : "This cannot be undone."}`,
      () => commit(removeTransaction(s, t.id, reverse)),
    );
  const list = (items: Transaction[]) => (
    <TransactionList
      s={s}
      items={items}
      format={fmt}
      edit={editTransaction}
      remove={remove}
    />
  );
  function archiveCategory(c: Category) {
    ask(
      c.archived ? "Restore category?" : "Archive category?",
      c.archived
        ? "This category will appear in your budget again."
        : "Its history stays intact. Its previous category limit is released; unpaid items stay reserved until paid or cancelled.",
      () =>
        commit({
          ...s!,
          categories: s!.categories.map((x) =>
            x.id === c.id ? { ...x, archived: !x.archived } : x,
          ),
        }),
    );
  }
  function reorder(id: string, direction: number) {
    const categories = [...s!.categories];
    const i = categories.findIndex((c) => c.id === id),
      j = i + direction;
    if (j < 0 || j >= categories.length) return;
    [categories[i], categories[j]] = [categories[j], categories[i]];
    commit({ ...s!, categories });
  }
  function purchaseList(items: Purchase[]) {
    return items.length ? (
      <div className="purchase-list">
        {items.map((p) => (
          <div
            className={`purchase ${p.status === "cancelled" ? "cancelled" : ""}`}
            key={p.id}
          >
            <button
              className={`checkbox ${p.status === "paid" ? "checked" : ""}`}
              disabled={p.status === "paid" || p.status === "cancelled"}
              aria-label={`${p.status === "paid" ? "Paid" : p.status === "cancelled" ? "Cancelled" : "Mark paid"}: ${p.name}`}
              onClick={() => setEditor({ kind: "pay", item: p })}
            >
              {p.status === "paid" ? (
                <Check size={15} />
              ) : p.status === "cancelled" ? (
                <X size={15} />
              ) : (
                <Clock3 size={15} />
              )}
            </button>
            <div className="purchase-description">
              <strong>{p.name}</strong>
              <small>
                {p.quantity > 1 ? `${p.quantity} × ` : ""}
                {fmt(p.estimate)} estimated
                {p.due ? " · Due " + p.due : ""}
              </small>
              {p.notes && <small>{p.notes}</small>}
            </div>
            <div className="purchase-price">
              <strong>
                {fmt(
                  p.status === "paid"
                    ? p.actual
                    : p.actual || p.estimate * p.quantity,
                )}
              </strong>
              <span className={`status ${p.status}`}>
                {p.status === "purchased"
                  ? "unpaid"
                  : p.status === "planned"
                    ? "to pay"
                    : p.status}
              </span>
            </div>
            <div className="row-actions">
              {p.status !== "paid" && (
                <button
                  className="icon-button"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => setEditor({ kind: "purchase", item: p })}
                >
                  <Pencil size={15} />
                </button>
              )}
              {p.status !== "paid" && p.status !== "cancelled" && (
                <button
                  className="button small"
                  onClick={() => setEditor({ kind: "pay", item: p })}
                >
                  Mark paid
                </button>
              )}
              {p.status !== "paid" && (
                <button
                  className="button small"
                  onClick={() =>
                    commit({
                      ...s!,
                      purchases: s!.purchases.map((x) =>
                        x.id === p.id
                          ? {
                              ...x,
                              status:
                                p.status === "cancelled"
                                  ? "planned"
                                  : "cancelled",
                            }
                          : x,
                      ),
                    })
                  }
                >
                  {p.status === "cancelled" ? "Restore item" : "Cancel item"}
                </button>
              )}
              {p.status === "paid" && (
                <button
                  className="button small"
                  onClick={() => {
                    const t = s!.transactions.find((t) => t.id === p.expenseId);
                    if (t) editTransaction(t);
                  }}
                >
                  Payment
                </button>
              )}
              <button
                className="icon-button"
                aria-label={`Delete purchase ${p.name}`}
                onClick={() =>
                  ask(
                    "Delete planned item?",
                    p.status === "paid"
                      ? "The linked expense stays in your transaction history."
                      : "This removes the item from your checklist.",
                    () =>
                      commit({
                        ...s!,
                        purchases: s!.purchases.filter((x) => x.id !== p.id),
                      }),
                  )
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty">Nothing on your list yet. Make a little plan!</div>
    );
  }
  function categoryCard(c: Category) {
    return (
      <button
        className="category-card"
        style={{ "--accent": c.color } as React.CSSProperties}
        key={c.id}
        onClick={() => {
          navigate("Budget", c.id);
        }}
      >
        <div>
          <span className="sticker">{c.icon}</span>
          <ChevronRight size={17} />
        </div>
        <h3>{c.name}</h3>
        <small>View items and category history</small>
      </button>
    );
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Dashboard");
          }}
          className="wordmark"
        >
          pokette<span>budgette ♡</span>
        </a>
        <span className="sidebar-caption">A LITTLE SPACE FOR YOUR PLANS</span>
        <nav aria-label="Primary navigation">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={page === name ? "active" : ""}
              aria-current={page === name ? "page" : undefined}
              onClick={() => navigate(name)}
            >
              <Icon size={21} />
              <span>{name}</span>
              {page === name && (
                <span className="nav-dot" aria-hidden="true">
                  •
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Heart size={25} />
          <p>
            Your money,
            <br />
            your pace.
          </p>
          <span>little steps count ♡</span>
        </div>
        <div className="local-label">
          <span /> Saved on this device
        </div>
      </aside>
      <main className="main">
        <OfflineStatus offline={offline} />
        <header className="topbar">
          <div className="breadcrumb">
            My little planner <ChevronRight size={14} /> <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="date">
              {new Intl.DateTimeFormat("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date())}
            </span>
            <button
              className="icon-button"
              aria-label={hidden ? "Show balances" : "Hide balances"}
              onClick={() => setHidden(!hidden)}
            >
              {hidden ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
            <span className="avatar" aria-hidden="true">
              ♡
            </span>
          </div>
        </header>
        {(inDemo || s.mode === "demo") && (
          <div className="demo-banner">
            <span>
              {inDemo
                ? "Temporary demo · Fictional records. Your saved workspace is untouched. Reloading exits demo."
                : "Saved legacy demo · Fictional records."}
            </span>
            {inDemo && (
              <button
                onClick={() => {
                  exitDemo();
                  navigate("Dashboard");
                }}
              >
                Exit demo
              </button>
            )}
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {actionError && (
          <p className="error" role="alert">
            {actionError}
          </p>
        )}
        <div className="page-heading">
          <div>
            {detail && (
              <button className="back" onClick={() => setDetail(null)}>
                <ArrowLeft size={16} /> Back to {page.toLowerCase()}
              </button>
            )}
            <span className="eyebrow">
              {page === "Dashboard"
                ? "A FRESH LOOK AT YOUR LITTLE PLANS"
                : "YOUR MONEY, YOUR PACE"}
            </span>
            <h1>
              {page === "Dashboard"
                ? "Hello, lovely planner"
                : (category?.name ?? wallet?.name ?? pageTitles[page])}
              {page === "Dashboard" && <span className="heading-spark">✧</span>}
            </h1>
            <p>
              {page === "Dashboard"
                ? "Let’s see what’s in your pockets today."
                : page === "Wallets"
                  ? "Every pocket has a purpose. Keep yours together."
                  : page === "Budget"
                    ? "A little intention for the things that matter."
                    : page === "Transactions"
                      ? "Every little in and out, all in one place."
                      : "Made for your everyday, kept on your device."}
            </p>
          </div>
          {page === "Wallets" && !detail && (
            <button
              className="button primary"
              onClick={() => setEditor({ kind: "wallet" })}
            >
              <Plus size={18} /> Add wallet
            </button>
          )}
          {page === "Transactions" && (
            <button
              className="button primary"
              onClick={() => setEditor({ kind: "transaction" })}
            >
              <Plus size={18} /> Add transaction
            </button>
          )}
        </div>
        {page === "Dashboard" && (
          <>
            <UpdateNotice offline={offline} />
            <section className="dashboard-top">
              <div className="balance-card">
                <span className="eyebrow">IN YOUR POCKETS</span>
                <div className="balance-label">
                  Total accessible balance <span aria-hidden="true">♡</span>
                </div>
                <strong
                  className={
                    totals.accessible < 0 ? "hero-money negative" : "hero-money"
                  }
                >
                  {fmt(totals.accessible)}
                </strong>
                <div className="balance-bottom">
                  <div>
                    <span>Reserved for your plans</span>
                    <strong>{fmt(totals.reserved)}</strong>
                  </div>
                  <div>
                    <span>Safe to spend</span>
                    <strong className={totals.safe < 0 ? "negative" : ""}>
                      {fmt(totals.safe)}
                    </strong>
                  </div>
                </div>
                <span className="balance-doodle" aria-hidden="true">
                  ✳
                </span>
              </div>
              <div className="sticky-note">
                <span className="tape" />
                <span className="handwritten">a little reminder…</span>
                <h2>
                  Big dreams start
                  <br />
                  with little plans.
                </h2>
                <p>
                  Your budget is here to help,
                  <br />
                  one day at a time.
                </p>
                <span className="note-heart" aria-hidden="true">
                  ♡
                </span>
              </div>
            </section>
            <div className="quick-actions">
              <span>Make a little move</span>
              <button
                onClick={() =>
                  setEditor({ kind: "transaction", type: "income" })
                }
              >
                <span className="round-icon sage">
                  <ArrowDownLeft size={19} />
                </span>
                Add income
              </button>
              <button
                onClick={() =>
                  setEditor({ kind: "transaction", type: "expense" })
                }
              >
                <span className="round-icon blush">
                  <ArrowUpRight size={19} />
                </span>
                Add expense
              </button>
              <button
                onClick={() =>
                  setEditor({ kind: "transaction", type: "transfer" })
                }
              >
                <span className="round-icon lavender">
                  <ArrowLeftRight size={19} />
                </span>
                Transfer
              </button>
              <button onClick={() => setEditor({ kind: "purchase" })}>
                <span className="round-icon cream">
                  <NotebookPen size={19} />
                </span>
                Add something to pay
              </button>
            </div>
            <div
              className={`dashboard-bottom ${dashboardStyle === "simple" ? "simple-dashboard" : ""}`}
            >
              <section className="panel">
                <div className="section-heading">
                  <h2>Recent little moves</h2>
                  <button
                    className="text-button"
                    onClick={() => navigate("Transactions")}
                  >
                    View all <ChevronRight size={16} />
                  </button>
                </div>
                {list(recent.slice(0, 4))}
              </section>
              {dashboardStyle === "detailed" && (
                <section className="panel spending">
                  <div className="section-heading">
                    <h2>Spending snapshot</h2>
                    <span className="pill">This month</span>
                  </div>
                  {chart.length ? (
                    <>
                      <div
                        className="chart"
                        role="img"
                        aria-label={`Spending this month: ${fmt(monthlyTotal)}`}
                      >
                        <ResponsiveContainer width="100%" height={170}>
                          <PieChart>
                            <Pie
                              data={chart}
                              dataKey="value"
                              innerRadius={55}
                              outerRadius={76}
                              paddingAngle={4}
                              stroke="none"
                              isAnimationActive={false}
                            >
                              {chart.map((c) => (
                                <Cell key={c.name} fill={c.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="chart-center">
                          <small>Total spent</small>
                          <strong>{fmt(monthlyTotal)}</strong>
                        </div>
                      </div>
                      <div className="chart-legend">
                        {chart.map((c) => (
                          <div key={c.name}>
                            <span style={{ background: c.color }} />
                            <small>{c.name}</small>
                            <strong>{fmt(c.value)}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty">
                      <span className="empty-flower">✿</span>No spending
                      recorded this month.
                      <br />
                      Your story starts with your first expense.
                    </div>
                  )}
                </section>
              )}
            </div>
            {dashboardStyle === "detailed" && (
              <section className="panel">
                <div className="section-heading">
                  <h2>Coming up in your plans</h2>
                  <button
                    className="text-button"
                    onClick={() => navigate("Budget")}
                  >
                    Open checklist <ChevronRight size={16} />
                  </button>
                </div>
                {purchaseList(
                  s.purchases
                    .filter(
                      (p) => p.status === "planned" || p.status === "purchased",
                    )
                    .sort((a, b) =>
                      (a.due || "9999").localeCompare(b.due || "9999"),
                    )
                    .slice(0, 3),
                )}
                <p className="hint">
                  Unpaid plans do not reduce wallet balances.
                </p>
              </section>
            )}
          </>
        )}
        {page === "Wallets" && (
          <>
            {wallet ? (
              <>
                <section className="panel wallet-detail">
                  <span className="sticker lavender">
                    <WalletIcon />
                  </span>
                  <div>
                    <small>
                      {wallet.type} · NGN{wallet.archived ? " · Archived" : ""}
                    </small>
                    <h2 className={balance(s, wallet.id) < 0 ? "negative" : ""}>
                      {fmt(balance(s, wallet.id))}
                    </h2>
                    <p>
                      Opening balance: {fmt(wallet.opening)} ·{" "}
                      {wallet.accessible ? "Accessible" : "Not accessible"}
                    </p>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => setEditor({ kind: "wallet", item: wallet })}
                  >
                    Edit wallet
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      ask(
                        wallet.archived ? "Restore wallet?" : "Archive wallet?",
                        "Its balance and transaction history are preserved. Archived wallets cannot receive new transactions.",
                        () =>
                          commit({
                            ...s,
                            wallets: s.wallets.map((w) =>
                              w.id === wallet.id
                                ? { ...w, archived: !w.archived }
                                : w,
                            ),
                          }),
                      )
                    }
                  >
                    {wallet.archived ? "Restore" : "Archive"}
                  </button>
                  {!wallet.archived && (
                    <button
                      className="button primary"
                      onClick={() =>
                        setEditor({ kind: "transaction", walletId: wallet.id })
                      }
                    >
                      Add transaction
                    </button>
                  )}
                </section>
                <section className="panel">
                  <h2>Wallet history</h2>
                  {list(
                    recent.filter(
                      (t) =>
                        t.walletId === wallet.id || t.toWalletId === wallet.id,
                    ),
                  )}
                </section>
              </>
            ) : (
              <>
                <label className="check archive-toggle">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                  />{" "}
                  Show archived wallets
                </label>
                <div className="wallet-grid">
                  {s.wallets
                    .filter((w) => showArchived || !w.archived)
                    .map((w, i) => (
                      <button
                        key={w.id}
                        className="wallet-card"
                        style={{
                          background: ["#eee4fb", "#e2f0e5", "#fff0df"][i % 3],
                        }}
                        onClick={() => setDetail(w.id)}
                      >
                        <div>
                          <span className="sticker">
                            <WalletIcon />
                          </span>
                          <span className="pill">{w.type}</span>
                        </div>
                        <h2>{w.name}</h2>
                        <strong
                          className={
                            balance(s, w.id) < 0
                              ? "wallet-amount negative"
                              : "wallet-amount"
                          }
                        >
                          {fmt(balance(s, w.id))}
                        </strong>
                        <p>
                          {w.accessible ? "Accessible" : "Not accessible"}
                          {w.archived ? " · Archived" : ""}
                          <ChevronRight size={18} />
                        </p>
                      </button>
                    ))}
                </div>
                {!s.wallets.length && (
                  <div className="panel empty">
                    <WalletIcon size={40} />
                    <h2>Give your money a little home.</h2>
                    <p>Add a bank account, cash wallet, or digital pocket.</p>
                    <button
                      className="button primary"
                      onClick={() => setEditor({ kind: "wallet" })}
                    >
                      Create your first wallet
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {page === "Budget" && (
          <>
            {category ? (
              <>
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <span className="pill">
                        {category.start} — {category.end}
                      </span>
                      <p>
                        {category.notes || "A little plan for this period."}
                        {category.archived ? " · Archived" : ""}
                      </p>
                    </div>
                    <div className="inline-actions">
                      <button
                        className="button secondary"
                        onClick={() =>
                          setEditor({ kind: "category", item: category })
                        }
                      >
                        Edit category
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => archiveCategory(category)}
                      >
                        {category.archived ? "Restore" : "Archive"}
                      </button>
                    </div>
                  </div>
                  <details className="budget-drawer">
                    <summary>Previous category limit & spending</summary>
                    <div className="stat-grid">
                      <div>
                        <span>Allocated</span>
                        <strong>{fmt(category.allocation)}</strong>
                      </div>
                      <div>
                        <span>Spent in period</span>
                        <strong>{fmt(spent(s, category))}</strong>
                      </div>
                      <div>
                        <span>Remaining</span>
                        <strong
                          className={
                            category.allocation - spent(s, category) < 0
                              ? "negative"
                              : ""
                          }
                        >
                          {fmt(category.allocation - spent(s, category))}
                        </strong>
                      </div>
                    </div>
                  </details>
                </section>
              </>
            ) : (
              <>
                <BudgetList
                  s={s}
                  format={fmt}
                  add={(month) =>
                    setEditor({
                      kind: "purchase",
                      due: month ? `${month}-01` : today(),
                    })
                  }
                  expense={() =>
                    setEditor({ kind: "transaction", type: "expense" })
                  }
                  renderItems={purchaseList}
                />
                <Planning s={s} save={commit} format={fmt} />
                <details className="budget-drawer category-manager">
                  <summary>
                    Manage categories <small>Optional</small>
                  </summary>
                  <p className="hint">
                    All your categories live here, including ones without a
                    budget. Edit, reorder, or archive them whenever you need to.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => setEditor({ kind: "category" })}
                  >
                    Create custom category
                  </button>
                  <label className="check archive-toggle">
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                    />{" "}
                    Show archived categories
                  </label>
                  <div className="category-grid">
                    {s.categories
                      .filter((c) => showArchived || !c.archived)
                      .map((c) => (
                        <div key={c.id}>
                          {categoryCard(c)}
                          <div className="category-actions">
                            <button
                              className="icon-button"
                              disabled={s.categories.indexOf(c) === 0}
                              aria-label={`Move ${c.name} up`}
                              onClick={() => reorder(c.id, -1)}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              className="icon-button"
                              disabled={
                                s.categories.indexOf(c) ===
                                s.categories.length - 1
                              }
                              aria-label={`Move ${c.name} down`}
                              onClick={() => reorder(c.id, 1)}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              className="text-button"
                              onClick={() => archiveCategory(c)}
                            >
                              <Archive size={14} />
                              {c.archived ? "Restore" : "Archive"}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </details>
              </>
            )}
            {category && (
              <section className="panel">
                <div className="section-heading">
                  <h2>Things to pay for</h2>
                  <button
                    className="button primary"
                    onClick={() =>
                      setEditor({ kind: "purchase", categoryId: category.id })
                    }
                  >
                    Add something to pay
                  </button>
                </div>
                {purchaseList(
                  s.purchases.filter((p) => p.categoryId === category.id),
                )}
              </section>
            )}
            {category && (
              <section className="panel">
                <h2>Category transaction history</h2>
                {list(recent.filter((t) => t.categoryId === category.id))}
              </section>
            )}
          </>
        )}
        {page === "Transactions" && (
          <section className="panel">
            <div className="filters">
              <label className="search">
                <Search size={18} />
                <input
                  aria-label="Search transactions"
                  placeholder="Find a little move…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <select
                aria-label="Filter transaction type"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["all", "income", "expense", "transfer", "loans", "gifts"].map(
                  (x) => (
                    <option key={x} value={x}>
                      {x === "all" ? "All types" : x}
                    </option>
                  ),
                )}
              </select>
              <select
                aria-label="Filter wallet"
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
              >
                <option value="all">All wallets</option>
                {s.wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            {list(
              recent.filter(
                (t) =>
                  (filter === "all" ||
                    (filter === "loans"
                      ? t.link?.kind === "principal" ||
                        t.link?.kind === "repayment"
                      : filter === "gifts"
                        ? t.link?.kind === "gift"
                        : t.type === filter &&
                          t.link?.kind !== "principal" &&
                          t.link?.kind !== "repayment")) &&
                  (walletFilter === "all" ||
                    t.walletId === walletFilter ||
                    t.toWalletId === walletFilter) &&
                  (
                    t.description +
                    " " +
                    t.notes +
                    " " +
                    s.categories.find((c) => c.id === t.categoryId)?.name
                  )
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              ),
            )}
          </section>
        )}
        {page === "More" && (
          <div className="settings-grid">
            <section className="panel">
              <h2>Understand your money</h2>
              <p>
                Explore recorded income, spending, plans, and savings with clear
                date filters.
              </p>
              <button
                className="button primary"
                onClick={() => navigate("Reports")}
              >
                Open Reports
              </button>
            </section>
            <Appearance />
            <DataPrivacy
              s={s}
              save={commit}
              demo={inDemo}
              restoreDemo={restoreDemo}
            />
            <section className="panel">
              <h2>Try without using real money</h2>
              <p>
                Explore a temporary fictional budget. Demo changes stay in
                memory; your saved records are untouched. Reloading or exiting
                returns to your saved workspace.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  inDemo ? exitDemo() : enterDemo();
                  navigate("Dashboard");
                }}
              >
                {inDemo ? "Exit demo budget" : "Try Demo Budget"}
              </button>
            </section>
            <BeginnerGuide go={navigate} />
            <OfflinePanel offline={offline} />
            <section className="panel">
              <span className="sticker lavender">
                <Heart />
              </span>
              <h2>Your space, on your device</h2>
              <p>
                Pokette keeps your workspace in this browser’s local storage. It
                doesn’t automatically sync between devices. Clearing browser
                data can remove your records.
              </p>
              <p>
                All wallets use Nigerian naira (NGN). There is no currency
                conversion.
              </p>
              <button
                className="button secondary"
                onClick={() => setHidden(!hidden)}
              >
                {hidden ? <Eye size={18} /> : <EyeOff size={18} />}{" "}
                {hidden ? "Show" : "Hide"} financial amounts
              </button>
              <p className="hint">
                Hiding amounts is visual privacy, not encryption.
              </p>
            </section>
            <section className="panel">
              <span className="sticker cream">
                <Sparkles />
              </span>
              <h2>A fresh little page</h2>
              <p>
                Your workspace:{" "}
                <strong>
                  {s.mode === "demo" ? "Fictional demo" : "Personal"}
                </strong>
                .
              </p>
              <p>
                Reset removes wallets, transactions, purchases, and budgets from
                this browser.
              </p>
              <button
                className="button danger"
                onClick={() =>
                  ask(
                    "Clear this workspace?",
                    "All saved records will be permanently removed from this browser. This cannot be undone.",
                    () => {
                      if (clearRecords()) navigate("Dashboard");
                    },
                  )
                }
              >
                Clear data & start fresh
              </button>
            </section>
          </div>
        )}
        {page === "Reports" && (
          <Suspense fallback={<p role="status">Opening your reports…</p>}>
            <Reports s={s} format={fmt} hidden={hidden} />
          </Suspense>
        )}
        <footer className="page-footer">
          <span>pokette budgette ♡ · V3.1.0</span>
          <small>Little plans, big dreams.</small>
        </footer>
      </main>
      {editor && (
        <Editors
          key={editor.kind + (editor.item?.id ?? "")}
          editor={editor}
          s={s}
          save={(next) => {
            if (!commit(next)) return false;
            if (firstWallet && editor.kind === "wallet") {
              setFirstWallet(false);
              navigate("Dashboard");
            }
            return true;
          }}
          close={() => {
            setEditor(null);
            setFirstWallet(false);
          }}
        />
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p>{confirm.text}</p>
          <footer>
            <button
              className="button secondary"
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                try {
                  confirm.action();
                  setActionError("");
                } catch (e) {
                  setActionError((e as Error).message);
                }
                setConfirm(null);
              }}
            >
              Confirm
            </button>
          </footer>
        </Modal>
      )}
    </div>
  );
}
