import { useEffect, useState } from "react";
import { applyTheme, readTheme, THEME_KEY, type Theme } from "../theme";
import {
  useDashboardStyle,
  saveDashboard,
  type DashboardStyle,
} from "../data/preferences";
export function Appearance() {
  const dashboard = useDashboardStyle();
  const [theme, setTheme] = useState(readTheme);
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => setTheme(readTheme());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function choose(value: Theme) {
    try {
      localStorage.setItem(THEME_KEY, value);
      setTheme(value);
      applyTheme(value);
      setError("");
    } catch {
      setError("Your appearance choice could not be saved. Please try again.");
    }
  }
  return (
    <section className="panel appearance-panel">
      <h2>A little softer on your eyes</h2>
      <p>
        Choose the appearance that feels comfortable. System follows your
        device’s light or dark setting.
      </p>
      <fieldset className="theme-options">
        <legend>Appearance</legend>
        {(["light", "dark", "system"] as const).map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => choose(value)}
            />
            <span>
              {value === "light"
                ? "Light · Pastel paper"
                : value === "dark"
                  ? "Dark · Quiet evening"
                  : "System · Follow my device"}
            </span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span>Dashboard detail</span>
        <select
          value={dashboard}
          onChange={(e) => {
            try {
              saveDashboard(e.target.value as DashboardStyle);
              setError("");
            } catch {
              setError("Your dashboard preference could not be saved.");
            }
          }}
        >
          <option value="simple">Simple · balances and recent moves</option>
          <option value="detailed">
            Detailed · include spending and upcoming plans
          </option>
        </select>
      </label>
      <p className="hint">
        Amounts remain in Nigerian naira (NGN). Theme and layout choices never
        convert or change financial values.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
