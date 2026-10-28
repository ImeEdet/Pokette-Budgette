import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataPrivacy } from "./DataPrivacy";
import { demoState } from "../data/storage";
import { makeBackup } from "../data/backup";
import { THEME_KEY } from "../theme";
beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function file(raw: string) {
  const f = new File([raw], "backup.json", { type: "application/json" });
  Object.defineProperty(f, "text", { value: async () => raw });
  return f;
}
it("previews, cancels without writes, then replaces only after confirmation", async () => {
  const s = demoState();
  s.mode = "fresh";
  const save = vi.fn(() => true);
  render(<DataPrivacy s={s} save={save} demo={false} />);
  const user = userEvent.setup();
  const backup = JSON.stringify(makeBackup(s, "dark"));
  await user.upload(screen.getByLabelText("Import Backup"), file(backup));
  expect(await screen.findByRole("dialog")).toHaveTextContent("Review backup");
  expect(save).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Cancel restore" }));
  expect(save).not.toHaveBeenCalled();
  await user.upload(screen.getByLabelText("Import Backup"), file(backup));
  await screen.findByRole("dialog");
  await user.click(
    screen.getByRole("button", { name: "Replace with this backup" }),
  );
  expect(save).toHaveBeenCalledWith(s);
  expect(localStorage.getItem(THEME_KEY)).toBe("dark");
});
it("rejects invalid files and preserves preferences when workspace saving fails", async () => {
  const s = demoState();
  s.mode = "fresh";
  const save = vi.fn(() => false);
  localStorage.setItem(THEME_KEY, "light");
  render(<DataPrivacy s={s} save={save} demo={false} />);
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Import Backup"), file("bad"));
  await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
  expect(save).not.toHaveBeenCalled();
  await user.upload(
    screen.getByLabelText("Import Backup"),
    file(JSON.stringify(makeBackup(s, "dark"))),
  );
  await screen.findByRole("dialog");
  await user.click(
    screen.getByRole("button", { name: "Replace with this backup" }),
  );
  expect(localStorage.getItem(THEME_KEY)).toBe("light");
  expect(screen.getByRole("alert")).toHaveTextContent("not replaced");
});
