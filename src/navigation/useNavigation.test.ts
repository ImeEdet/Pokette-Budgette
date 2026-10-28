import { afterEach, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { readRoute, useNavigation } from "./useNavigation";
afterEach(() => {
  cleanup();
  history.replaceState(null, "", "/");
});
it("restores the current page and handles browser back navigation", () => {
  history.replaceState(null, "", "/#/wallets/wallet-a");
  const { result } = renderHook(() => useNavigation());
  expect(result.current.page).toBe("Wallets");
  expect(result.current.detail).toBe("wallet-a");
  act(() => result.current.go("Budget", "food"));
  expect(location.hash).toBe("#/budget/food");
  act(() => {
    history.replaceState(null, "", "/#/wallets/wallet-a");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(result.current.detail).toBe("wallet-a");
});
it("falls back safely for unknown pages and ignores unsupported detail routes", () => {
  expect(readRoute("#/unknown/record")).toEqual({
    page: "Dashboard",
    detail: null,
  });
  expect(readRoute("#/more/record")).toEqual({ page: "More", detail: null });
});
