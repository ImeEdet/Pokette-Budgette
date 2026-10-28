import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { emptyState, today } from "../domain/model";
import { load, persist } from "../data/storage";
import { overview, balance } from "../domain/finance";
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "/#/budget");
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const s = emptyState();
  s.wallets = [
    {
      id: "bank",
      name: "Bank",
      type: "Bank account",
      opening: 10000000,
      accessible: true,
      archived: false,
      currency: "NGN",
    },
  ];
  persist(s);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("adds a recurring bill to the checklist and defaults payment to its wallet", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText("Subscriptions & recurring bills"));
  await user.click(screen.getByRole("button", { name: "Add recurring bill" }));
  await user.type(screen.getByLabelText("Name"), "Spotify");
  await user.type(screen.getByLabelText("Amount (₦)"), "1500");
  await user.selectOptions(screen.getByLabelText("Wallet"), "bank");
  await user.selectOptions(
    screen.getByLabelText("Category"),
    load()!.categories[3].id,
  );
  await user.click(screen.getByRole("button", { name: "Save plan" }));
  expect(load()!.bills).toHaveLength(1);
  expect(load()!.purchases).toHaveLength(1);
  expect(load()!.transactions).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Mark paid: Spotify" }));
  expect(screen.getByLabelText("Wallet")).toHaveValue("bank");
  await user.click(screen.getByRole("button", { name: "Confirm payment" }));
  expect(load()!.transactions).toHaveLength(1);
  expect(balance(load()!, "bank")).toBe(9850000);
  await user.click(screen.getByRole("button", { name: "Pause bill" }));
  expect(load()!.bills[0].active).toBe(false);
}, 20000);
it("records partial income, a loan repayment and savings allocations with persisted balances", async () => {
  const user = userEvent.setup();
  const app = render(<App />);
  await user.click(screen.getByText("Money you’re expecting"));
  await user.click(screen.getByRole("button", { name: "Add expected income" }));
  await user.type(screen.getByLabelText("Name"), "Design project");
  await user.type(screen.getByLabelText("Expected amount (₦)"), "20000");
  await user.click(screen.getByRole("button", { name: "Save plan" }));
  expect(overview(load()!).accessible).toBe(10000000);
  await user.click(screen.getByRole("button", { name: "Record receipt" }));
  await user.type(screen.getByLabelText("Amount (₦)"), "5000");
  await user.selectOptions(screen.getByLabelText("Wallet"), "bank");
  await user.click(screen.getByRole("button", { name: "Save payment" }));
  expect(screen.getByText(new RegExp("Partially received"))).toBeVisible();
  expect(overview(load()!).accessible).toBe(10500000);
  await user.click(screen.getByText("Loans, gifts & family support"));
  await user.click(screen.getByRole("button", { name: "Add loan or gift" }));
  await user.type(screen.getByLabelText("Person"), "Ada");
  await user.type(screen.getByLabelText("Amount (₦)"), "1000");
  await user.selectOptions(screen.getByLabelText("Wallet"), "bank");
  await user.click(screen.getByRole("button", { name: "Save plan" }));
  expect(balance(load()!, "bank")).toBe(10400000);
  await user.click(screen.getByRole("button", { name: "Record repayment" }));
  await user.type(screen.getByLabelText("Amount (₦)"), "400");
  await user.selectOptions(screen.getByLabelText("Wallet"), "bank");
  await user.click(screen.getByRole("button", { name: "Save payment" }));
  expect(balance(load()!, "bank")).toBe(10440000);
  await user.click(screen.getByText("Savings goals"));
  await user.click(screen.getByRole("button", { name: "Create savings goal" }));
  await user.type(screen.getByLabelText("Name"), "New laptop");
  await user.type(screen.getByLabelText("Target amount (₦)"), "50000");
  await user.selectOptions(screen.getByLabelText("Wallet"), "bank");
  await user.click(screen.getByRole("button", { name: "Save plan" }));
  await user.click(screen.getByRole("button", { name: "Set money aside" }));
  await user.type(screen.getByLabelText("Amount (₦)"), "10000");
  await user.click(screen.getByRole("button", { name: "Save plan" }));
  expect(overview(load()!).safe).toBe(9440000);
  expect(load()!.transactions).toHaveLength(3);
  app.unmount();
  render(<App />);
  expect(load()!.goals[0].saved).toBe(1000000);
  expect(load()!.transactions.every((t) => t.date === today())).toBe(true);
}, 30000);
