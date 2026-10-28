import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Appearance } from "./components/Appearance";
import { readDashboard } from "./data/preferences";
import { applyTheme, readTheme, THEME_KEY } from "./theme";
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "";
});
it("persists dashboard detail independently of theme and records", async () => {
  const mounted = render(<Appearance />);
  await userEvent.selectOptions(
    screen.getByLabelText("Dashboard detail"),
    "simple",
  );
  expect(readDashboard()).toBe("simple");
  mounted.unmount();
  render(<Appearance />);
  expect(screen.getByLabelText("Dashboard detail")).toHaveValue("simple");
});
it("resolves system appearance and respects explicit light or dark choices", () => {
  applyTheme("system", true);
  expect(document.documentElement.dataset.theme).toBe("dark");
  applyTheme("system", false);
  expect(document.documentElement.dataset.theme).toBe("light");
  applyTheme("light", true);
  expect(document.documentElement.dataset.theme).toBe("light");
  applyTheme("dark", false);
  expect(document.documentElement.style.colorScheme).toBe("dark");
  localStorage.setItem(THEME_KEY, "bad");
  expect(readTheme()).toBe("system");
});
it("saves a theme across remount without modifying the financial workspace", async () => {
  const financial = "saved-financial-records";
  localStorage.setItem("pokette.workspace.v1", financial);
  const first = render(<Appearance />);
  await userEvent.click(screen.getByRole("radio", { name: /Dark/ }));
  expect(readTheme()).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem("pokette.workspace.v1")).toBe(financial);
  first.unmount();
  render(<Appearance />);
  expect(screen.getByRole("radio", { name: /Dark/ })).toBeChecked();
});
it("reports storage failure without pretending to save a new preference", async () => {
  render(<Appearance />);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("full");
  });
  await userEvent.click(screen.getByRole("radio", { name: /Dark/ }));
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
  expect(screen.getByRole("radio", { name: /System/ })).toBeChecked();
});
