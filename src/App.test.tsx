import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { load, persist, demoState } from "./data/storage";
import { balance, overview } from "./domain/finance";
import { emptyState, today } from "./domain/model";
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "/");
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
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("supports the Phase 1 acceptance workflow and reload", async () => {
  const user = userEvent.setup();
  const mounted = render(<App />);
  await user.click(screen.getByRole("button", { name: /Start Fresh/ }));
  await user.click(screen.getByRole("button", { name: "Wallets" }));
  await user.click(screen.getByRole("button", { name: "Add wallet" }));
  await user.type(screen.getByLabelText("Wallet name"), "Everyday");
  await user.click(screen.getByRole("button", { name: "Save wallet" }));
  await user.click(screen.getByRole("button", { name: "Add wallet" }));
  await user.type(screen.getByLabelText("Wallet name"), "Cash");
  await user.click(screen.getByRole("button", { name: "Save wallet" }));
  await user.click(screen.getByRole("button", { name: "Dashboard" }));
  await user.click(screen.getByRole("button", { name: "Add income" }));
  await user.type(screen.getByLabelText("Description"), "Work payment");
  await user.clear(screen.getByLabelText("Amount (₦)"));
  await user.type(screen.getByLabelText("Amount (₦)"), "10000");
  await user.click(screen.getByRole("button", { name: "Save transaction" }));
  await user.click(screen.getByRole("button", { name: "Add expense" }));
  await user.type(screen.getByLabelText("Description"), "Lunch");
  await user.clear(screen.getByLabelText("Amount (₦)"));
  await user.type(screen.getByLabelText("Amount (₦)"), "500");
  await user.click(screen.getByRole("button", { name: "Save transaction" }));
  await user.click(screen.getByRole("button", { name: "Transfer" }));
  await user.type(screen.getByLabelText("Description"), "Cash withdrawal");
  await user.clear(screen.getByLabelText("Amount (₦)"));
  await user.type(screen.getByLabelText("Amount (₦)"), "2000");
  await user.click(screen.getByRole("button", { name: "Save transaction" }));
  await user.click(screen.getByRole("button", { name: "Budget" }));
  await user.click(screen.getByText("Manage categories"));
  await user.click(
    screen.getByRole("button", { name: "Create custom category" }),
  );
  await user.type(screen.getByLabelText("Category name"), "Books");
  await user.click(screen.getByRole("button", { name: "Save category" }));
  await user.click(
    screen.getByRole("button", { name: "Add something to pay" }),
  );
  await user.type(
    screen.getByLabelText("What are you paying for?"),
    "Sketchbook",
  );
  await user.selectOptions(
    screen.getByLabelText("Category"),
    load()!.categories.find((c) => c.name === "Books")!.id,
  );
  await user.clear(screen.getByLabelText("Estimated amount (₦)"));
  await user.type(screen.getByLabelText("Estimated amount (₦)"), "300");
  await user.click(screen.getByRole("button", { name: "Save item" }));
  let s = load()!;
  expect(overview(s).accessible).toBe(950000);
  expect(overview(s).reserved).toBe(30000);
  expect(balance(s, s.wallets[0].id)).toBe(750000);
  expect(balance(s, s.wallets[1].id)).toBe(200000);
  await user.click(screen.getByRole("button", { name: "Mark paid" }));
  await user.click(screen.getByRole("button", { name: "Confirm payment" }));
  s = load()!;
  expect(s.transactions).toHaveLength(4);
  expect(overview(s).safe).toBe(920000);
  mounted.unmount();
  render(<App />);
  expect(
    screen.queryByRole("button", { name: "Start Fresh" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Budget" }));
  await user.click(screen.getByText(/Paid & cancelled/));
  expect(screen.getByText("Sketchbook")).toBeInTheDocument();
  expect(screen.getByText("paid")).toBeInTheDocument();
}, 20000);
it("keeps old data and shows an error when saving fails", async () => {
  const user = userEvent.setup();
  render(<App />);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Quota");
  });
  await user.click(screen.getByRole("button", { name: "Start Fresh" }));
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
  expect(load()).toBeNull();
  vi.restoreAllMocks();
});
it("groups payment items, cancels and restores without touching money, and keeps pockets off the dashboard", async () => {
  const s = emptyState();
  s.wallets = [
    {
      id: "bank",
      name: "Bank",
      type: "Bank account",
      opening: 1000000,
      accessible: true,
      archived: false,
      currency: "NGN",
    },
  ];
  s.purchases = ["Spotify", "ChatGPT"].map((name, i) => ({
    id: name,
    name,
    categoryId: s.categories[3].id,
    estimate: (i + 1) * 10000,
    quantity: 1,
    actual: 0,
    priority: "Medium",
    notes: "",
    due: today(),
    status: "planned",
  }));
  persist(s);
  const user = userEvent.setup();
  render(<App />);
  expect(screen.queryByText("Your budget pockets")).not.toBeInTheDocument();
  expect(screen.getByText("Recent little moves")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Budget" }));
  const group = screen.getByText("Spotify").closest("section")!;
  expect(within(group).getByRole("heading", { name: /Subscriptions/ })).toBeVisible();
  expect(within(group).getByText("Spotify")).toBeVisible();
  expect(within(group).getByText("ChatGPT")).toBeVisible();
  await user.click(
    within(group).getAllByRole("button", { name: "Cancel item" })[0],
  );
  expect(load()!.purchases[0].status).toBe("cancelled");
  expect(overview(load()!).reserved).toBe(20000);
  expect(balance(load()!, "bank")).toBe(1000000);
  await user.click(screen.getByText(/Paid & cancelled/));
  await user.click(screen.getByRole("button", { name: "Restore item" }));
  expect(overview(load()!).reserved).toBe(30000);
  expect(load()!.transactions).toHaveLength(0);
});
it("refuses to overwrite newer records from another tab", async () => {
  const user = userEvent.setup();
  render(<App />);
  persist(demoState());
  await user.click(screen.getByRole("button", { name: "Start Fresh" }));
  expect(screen.getByRole("alert")).toHaveTextContent("another tab");
  expect(load()?.mode).toBe("demo");
});
