import { useState } from "react";
import { type State, today } from "../domain/model";
import {
  makeBackup,
  parseBackup,
  transactionCSV,
  downloadFile,
  type Backup,
} from "../data/backup";
import { readTheme, applyTheme, THEME_KEY } from "../theme";
import { Modal } from "./Modal";
import { DASHBOARD_KEY, readDashboard } from "../data/preferences";
export function DataPrivacy({
  s,
  save,
  demo,
  restoreDemo,
}: {
  s: State;
  save: (s: State) => boolean;
  demo: boolean;
  restoreDemo?: (s: State) => void;
}) {
  const [pending, setPending] = useState<Backup | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  function exportBackup() {
    try {
      downloadFile(
        `pokette-${demo ? "demo-" : ""}${today()}.json`,
        JSON.stringify(makeBackup(s, readTheme(), readDashboard()), null, 2),
        "application/json",
      );
      setMessage("Backup download requested. Keep it somewhere private.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function restore() {
    if (!pending) return;
    if (pending.workspace.mode === "demo") {
      if (!restoreDemo) {
        setError(
          "Open this demo backup through the app’s temporary demo workspace.",
        );
        return;
      }
      restoreDemo(pending.workspace);
      setPending(null);
      setMessage(
        "Demo backup opened temporarily. Your saved workspace is untouched.",
      );
      return;
    }
    const theme = localStorage.getItem(THEME_KEY),
      dashboard = localStorage.getItem(DASHBOARD_KEY);
    try {
      // localStorage has no multi-key transaction. Roll back preferences if the single workspace write fails.
      localStorage.setItem(THEME_KEY, pending.preferences.theme);
      localStorage.setItem(DASHBOARD_KEY, pending.preferences.dashboard);
      if (!save(pending.workspace))
        throw new Error(
          "Restore could not be saved. Your financial records were not replaced.",
        );
      applyTheme(pending.preferences.theme);
      window.dispatchEvent(new Event("storage"));
      setPending(null);
      setMessage("Backup restored on this device.");
      setError("");
    } catch (e) {
      try {
        theme === null
          ? localStorage.removeItem(THEME_KEY)
          : localStorage.setItem(THEME_KEY, theme);
        dashboard === null
          ? localStorage.removeItem(DASHBOARD_KEY)
          : localStorage.setItem(DASHBOARD_KEY, dashboard);
      } catch {}
      setError((e as Error).message);
    }
  }
  return (
    <section className="panel" aria-labelledby="privacy-title">
      <h2 id="privacy-title">Your Data & Privacy</h2>
      <p>
        Your budget is stored on this device. Export a backup to keep a copy or
        move your data to another device.
      </p>
      <div className="inline-actions">
        <button className="button secondary" onClick={exportBackup}>
          Export Backup
        </button>
        <button
          className="button secondary"
          onClick={() => {
            try {
              downloadFile(
                `pokette-transactions-${today()}.csv`,
                transactionCSV(s),
                "text/csv;charset=utf-8",
              );
              setMessage(
                "CSV download requested. CSV is not a complete backup.",
              );
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Export CSV
        </button>
      </div>
      <label className="field">
        <span>Import Backup</span>
        <input
          type="file"
          accept=".json,application/json"
          disabled={demo}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setError("");
            setMessage("");
            setPending(null);
            try {
              if (file.size > 10_000_000)
                throw new Error("Maximum backup size is 10 MB.");
              const backup = parseBackup(await file.text());
              setPending(backup);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        />
      </label>
      {demo && (
        <p className="hint">
          Restore is disabled in the temporary demo. Exit demo to restore a
          personal backup.
        </p>
      )}
      <details>
        <summary>How your information is handled</summary>
        <ul>
          <li>
            Pokette records what you enter. It does not hold money, make
            payments, or connect to your bank.
          </li>
          <li>
            The current app has no financial-data upload, analytics, app login,
            or app-level encryption. Hosting may keep ordinary access logs if
            the app is published.
          </li>
          <li>
            Your records do not automatically sync between browsers or devices.
            Anyone using the same browser profile may be able to open them.
          </li>
          <li>
            Clearing website storage can erase your records. Backups and
            screenshots can contain private financial information.
          </li>
          <li>
            Backups are generated and imported locally. CSV includes
            transactions, with expenses negative and transfers listed once; it
            is not a bank statement or complete backup.
          </li>
        </ul>
      </details>
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {pending && (
        <Modal
          title="Review backup before restoring"
          onClose={() => setPending(null)}
        >
          <p>
            Created {new Date(pending.createdAt).toLocaleString()} · App{" "}
            {pending.appVersion}
          </p>
          <p>
            {pending.workspace.wallets.length} wallets ·{" "}
            {pending.workspace.transactions.length} transactions ·{" "}
            {pending.workspace.purchases.length} planned items ·{" "}
            {pending.workspace.bills.length} recurring bills ·{" "}
            {pending.workspace.incomes.length} income plans ·{" "}
            {pending.workspace.loans.length} loans/gifts ·{" "}
            {pending.workspace.goals.length} savings goals
          </p>
          <p>
            {pending.workspace.mode === "demo"
              ? "This fictional demo backup opens temporarily without replacing your saved workspace. Appearance stays unchanged."
              : "This replaces this device’s current workspace and appearance settings. It does not merge records. Export a safety backup first if you want to keep the current records."}
          </p>
          <button className="button secondary" onClick={exportBackup}>
            Export safety backup
          </button>
          <footer>
            <button
              className="button secondary"
              onClick={() => setPending(null)}
            >
              Cancel restore
            </button>
            <button className="button danger" onClick={restore}>
              {pending.workspace.mode === "demo"
                ? "Open temporary demo backup"
                : "Replace with this backup"}
            </button>
          </footer>
        </Modal>
      )}
    </section>
  );
}
