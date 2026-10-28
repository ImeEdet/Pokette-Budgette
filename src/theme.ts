export type Theme = "system" | "light" | "dark";
export const THEME_KEY = "pokette.appearance.v1";
export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}
export function applyTheme(
  theme: Theme,
  systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ??
    false,
) {
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? "#201c26" : "#DCC9F5");
}
export function initializeTheme() {
  applyTheme(readTheme());
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener("change", (e) => {
    if (readTheme() === "system") applyTheme("system", e.matches);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY || e.key === null) applyTheme(readTheme());
  });
}
