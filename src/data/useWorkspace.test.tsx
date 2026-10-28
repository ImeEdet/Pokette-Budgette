import { beforeEach, afterEach, it, expect } from "vitest";
import { act, renderHook, cleanup } from "@testing-library/react";
import { useWorkspace } from "./useWorkspace";
import { persist, load, STORAGE_KEY } from "./storage";
import { emptyState } from "../domain/model";
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it("keeps demo edits and schedule generation entirely separate from saved records", () => {
  const s = emptyState();
  s.wallets = [
    {
      id: "real",
      name: "My actual bank",
      type: "Bank account",
      opening: 12345,
      accessible: true,
      archived: false,
      currency: "NGN",
    },
  ];
  persist(s);
  const bytes = localStorage.getItem(STORAGE_KEY);
  const { result, unmount } = renderHook(useWorkspace);
  act(() => result.current.enterDemo());
  expect(result.current.inDemo).toBe(true);
  act(() =>
    result.current.commit({
      ...result.current.state!,
      wallets: result.current.state!.wallets.map((w) => ({ ...w, opening: 0 })),
    }),
  );
  expect(localStorage.getItem(STORAGE_KEY)).toBe(bytes);
  act(() => result.current.exitDemo());
  expect(result.current.state).toEqual(s);
  act(() => result.current.enterDemo());
  unmount();
  const next = renderHook(useWorkspace);
  expect(next.result.current.inDemo).toBe(false);
  expect(next.result.current.state).toEqual(s);
});
it("clears live budget and migration recovery copy only after an explicit clear action", () => {
  persist(emptyState());
  localStorage.setItem("pokette.backup.before-v2", "private recovery data");
  const { result } = renderHook(useWorkspace);
  act(() => result.current.clearRecords());
  expect(localStorage.getItem("pokette.backup.before-v2")).toBeNull();
  expect(load()!.wallets).toEqual([]);
});
it("opens a restored demo backup without writing over the personal workspace", () => {
  const s = emptyState();
  persist(s);
  const bytes = localStorage.getItem(STORAGE_KEY);
  const { result } = renderHook(useWorkspace);
  const demo = emptyState("demo");
  act(() => result.current.restoreDemo(demo));
  expect(result.current.inDemo).toBe(true);
  expect(localStorage.getItem(STORAGE_KEY)).toBe(bytes);
  act(() => result.current.exitDemo());
  expect(result.current.state).toEqual(s);
});
