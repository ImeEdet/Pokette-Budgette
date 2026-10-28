import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { type State, today } from "../domain/model";
import { dateRange, report } from "../domain/reports";
export default function Reports({
  s,
  format,
  hidden,
}: {
  s: State;
  format: (n: number) => string;
  hidden: boolean;
}) {
  const [preset, setPreset] = useState("month"),
    [range, setRange] = useState(dateRange("month"));
  const [draft, setDraft] = useState(range),
    [dateError, setDateError] = useState("");
  let data;
  try {
    data = report(s, range.start, range.end);
  } catch (e) {
    return (
      <section className="panel">
        <p role="alert">{(e as Error).message}</p>
        <button
          className="button secondary"
          onClick={() => {
            setPreset("month");
            setRange(dateRange("month"));
          }}
        >
          Reset dates
        </button>
      </section>
    );
  }
  const outstanding = data.commitments
    .filter((p) => p.status === "planned" || p.status === "purchased")
    .reduce((n, p) => n + (p.actual || p.estimate * p.quantity), 0);
  return (
    <div className="reports">
      <section className="panel">
        <div className="filters">
          <label className="field">
            <span>Report period</span>
            <select
              value={preset}
              onChange={(e) => {
                setPreset(e.target.value);
                setDraft(range);
                setDateError("");
                if (e.target.value !== "custom")
                  setRange(dateRange(e.target.value));
              }}
            >
              <option value="month">This month to date</option>
              <option value="last-month">Last month</option>
              <option value="three-months">Last 3 months to date</option>
              <option value="year">This year to date</option>
              <option value="custom">Custom dates</option>
            </select>
          </label>
          {preset === "custom" && (
            <>
              <label className="field">
                <span>From</span>
                <input
                  type="date"
                  value={draft.start}
                  onChange={(e) =>
                    setDraft({ ...draft, start: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>To</span>
                <input
                  type="date"
                  value={draft.end}
                  onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                />
              </label>
              <button
                className="button secondary"
                onClick={() => {
                  try {
                    report(s, draft.start, draft.end);
                    setRange(draft);
                    setDateError("");
                  } catch (e) {
                    setDateError((e as Error).message);
                  }
                }}
              >
                Apply dates
              </button>
            </>
          )}
        </div>
        {dateError && (
          <p className="error" role="alert">
            {dateError}
          </p>
        )}
        <p>
          {range.start} — {range.end}
        </p>
        <div className="stat-grid">
          <div>
            <span>Income received</span>
            <strong>{format(data.income)}</strong>
          </div>
          <div>
            <span>Ordinary spending</span>
            <strong>{format(data.expenses)}</strong>
          </div>
          <div>
            <span>Income less spending</span>
            <strong>{format(data.net)}</strong>
          </div>
        </div>
        <p className="hint">
          Includes gifts and actual income receipts. Excludes transfers, loan
          principal and repayments, reversed entries, and expected money that
          hasn’t arrived.
        </p>
        <p>
          Cash flow including loans and repayments:{" "}
          <strong>{format(data.cashFlow)}</strong>
        </p>
      </section>
      <section className="panel">
        <h2>Income & spending over time</h2>
        {!data.income && !data.expenses ? (
          <p className="empty">
            Not much to report yet. Add a few transactions and Pokette will help
            you spot patterns.
          </p>
        ) : (
          <>
            {!hidden && (
              <div
                role="img"
                aria-label="Monthly income and ordinary spending; exact amounts are in the table below."
                className="report-chart"
              >
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.months}>
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(n) => format(Number(n))}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--tone-fffdfb, #fffdfb)",
                        color: "var(--plum)",
                        borderColor: "var(--border)",
                      }}
                      formatter={(n) => format(Number(n))}
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name="Received"
                      fill="#88b99b"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Spent"
                      fill="#b392cc"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div
              className="table-scroll"
              role="region"
              aria-label="Monthly figures"
              tabIndex={0}
            >
              <table>
                <caption>Recorded monthly totals</caption>
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col">Received</th>
                    <th scope="col">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.months.map((m) => (
                    <tr key={m.month}>
                      <th scope="row">{m.month}</th>
                      <td>{format(m.income)}</td>
                      <td>{format(m.expenses)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      <section className="panel">
        <h2>Where your money went</h2>
        {data.categories.length ? (
          <>
            <p>
              {data.categories[0].actual > 0
                ? `${data.categories[0].name} was your largest spending category in this period.`
                : "Your dated plans are here; spending will appear as you record payments."}
            </p>
            <div
              className="table-scroll"
              role="region"
              aria-label="Spending by category"
              tabIndex={0}
            >
              <table>
                <caption>
                  Plans by item due date; actual spending by payment date.
                  Cancelled and undated plans are excluded.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Planned</th>
                    <th scope="col">Actual</th>
                    <th scope="col">Plan less actual</th>
                    <th scope="col">Share of spending</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categories.map((c) => (
                    <tr key={c.id}>
                      <th scope="row">{c.name}</th>
                      <td>{format(c.planned)}</td>
                      <td>{format(c.actual)}</td>
                      <td>{format(c.planned - c.actual)}</td>
                      <td>{hidden ? "••••" : c.percentage.toFixed(1) + "%"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p>No spending or dated plans in this period yet.</p>
        )}
        {data.undated > 0 && (
          <p className="hint">
            {data.undated} undated items are not included in the planned column.
            They still count in current reservations.
          </p>
        )}
        {data.legacy.length > 0 && (
          <details>
            <summary>Older category allocations</summary>
            {data.legacy.map((c) => (
              <p key={c.id}>
                {c.name} · {c.start} to {c.end}: {format(c.actual)} spent of{" "}
                {format(c.allocation)}, {format(c.allocation - c.actual)}{" "}
                remaining.
              </p>
            ))}
            <p className="hint">
              Only complete category periods inside the selected range are
              shown.
            </p>
          </details>
        )}
      </section>
      <section className="panel">
        <h2>Recurring commitments in this period</h2>
        <p>
          Unpaid total: <strong>{format(outstanding)}</strong>
        </p>
        {data.commitments.length ? (
          data.commitments.map((p) => (
            <p key={p.id}>
              {p.name} · {p.due} ·{" "}
              {p.status === "paid"
                ? "Paid"
                : p.status === "cancelled"
                  ? "Cancelled"
                  : p.due < today()
                    ? "Overdue"
                    : p.due === today()
                      ? "Due today"
                      : "Upcoming"}{" "}
              ·{" "}
              {format(
                p.status === "paid"
                  ? p.actual
                  : p.actual || p.estimate * p.quantity,
              )}
            </p>
          ))
        ) : (
          <p>No recurring items in this date range.</p>
        )}
        <p className="hint">
          Only generated checklist items are included; schedules create items
          through the current month. Choose a custom end date to include later
          dates in this month.
        </p>
      </section>
      <section className="panel">
        <h2>Your position today</h2>
        <p>
          Safe to spend: <strong>{format(data.totals.safe)}</strong> · Reserved:{" "}
          {format(data.totals.reserved)}
        </p>
        <p className="hint">
          These are current balances, not a historical snapshot of the selected
          period.
        </p>
        {s.goals.length ? (
          s.goals.map((g) => (
            <p key={g.id}>
              {g.icon} {g.name}: {format(g.saved)} set aside toward{" "}
              {format(g.target)}
              {g.saved >= g.target ? " · Goal reached ♡" : ""}
            </p>
          ))
        ) : (
          <p>Add a savings goal when you’re ready.</p>
        )}
      </section>
    </div>
  );
}
