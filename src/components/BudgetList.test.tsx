import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetList } from "./BudgetList";
import { emptyState, today } from "../domain/model";
import { money } from "../domain/finance";
afterEach(cleanup);
it("keeps undated items visible and lets users recover earlier unpaid plans", async () => {
  const s = emptyState();
  s.purchases = [
    { name: "Undated", due: "" },
    { name: "Earlier", due: "2000-01-01" },
    { name: "Future", due: "2999-01-01" },
  ].map((p) => ({
    ...p,
    id: p.name,
    categoryId: s.categories[0].id,
    estimate: 1000,
    actual: 0,
    quantity: 1,
    priority: "Medium",
    notes: "",
    status: "planned",
  }));
  const add = vi.fn();
  render(
    <BudgetList
      s={s}
      format={money}
      add={add}
      expense={vi.fn()}
      renderItems={(items) => items.map((p) => <p key={p.id}>{p.name}</p>)}
    />,
  );
  expect(screen.getByText("Undated")).toBeVisible();
  expect(screen.getByText("Earlier")).not.toBeVisible();
  expect(screen.queryByText("Future")).not.toBeInTheDocument();
  await userEvent.click(screen.getByText(/Still unpaid from earlier/));
  expect(screen.getByText("Earlier")).toBeVisible();
  await userEvent.click(
    screen.getByRole("button", { name: "Add something to pay" }),
  );
  expect(add).toHaveBeenCalledWith(today().slice(0, 7));
  await userEvent.click(screen.getByRole("button", { name: "All dates" }));
  expect(screen.getByText("Future")).toBeVisible();
});
