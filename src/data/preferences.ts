import { useEffect, useState } from "react";
export const DASHBOARD_KEY = "pokette.dashboard.v1";
export type DashboardStyle = "simple" | "detailed";
export function readDashboard(): DashboardStyle {
  try {
    return localStorage.getItem(DASHBOARD_KEY) === "simple"
      ? "simple"
      : "detailed";
  } catch {
    return "detailed";
  }
}
export function useDashboardStyle() {
  const [value, setValue] = useState(readDashboard);
  useEffect(() => {
    const sync = () => setValue(readDashboard());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return value;
}
export function saveDashboard(value: DashboardStyle) {
  localStorage.setItem(DASHBOARD_KEY, value);
  window.dispatchEvent(new Event("storage"));
}
