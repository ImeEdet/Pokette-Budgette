import { it, expect } from "vitest";
import { makeBackup, parseBackup, transactionCSV } from "./backup";
import { demoState } from "./storage";
import { overview, balance } from "../domain/finance";
it("round-trips every V2 collection and preferences without changing balances", () => {
  const s = demoState();
  const b = parseBackup(JSON.stringify(makeBackup(s, "dark", "simple")));
  expect(b.workspace).toEqual(s);
  expect(b.preferences).toEqual({ theme: "dark", dashboard: "simple" });
  expect(overview(b.workspace)).toEqual(overview(s));
  for (const w of s.wallets)
    expect(balance(b.workspace, w.id)).toBe(balance(s, w.id));
});
it("rejects unsupported, malformed, unsafe and orphaned backups", () => {
  const b = makeBackup(demoState(), "system");
  expect(() => parseBackup("nope")).toThrow();
  expect(() =>
    parseBackup(JSON.stringify({ ...b, schemaVersion: 9 })),
  ).toThrow();
  expect(() => parseBackup('{"__proto__":{}}')).toThrow();
  expect(() =>
    parseBackup(
      JSON.stringify({ ...b, workspace: { ...b.workspace, wallets: [] } }),
    ),
  ).toThrow();
  expect(() =>
    parseBackup(JSON.stringify({ ...b, preferences: { theme: "neon" } })),
  ).toThrow();
});
it("exports exact amounts, Unicode, quotes, newlines and neutralizes spreadsheet formulas", () => {
  const s = demoState();
  s.transactions[0].description = "=SUM(A1)";
  s.transactions[0].notes = 'Ada, "hello"\n₦';
  s.transactions[0].amount = 12345;
  const csv = transactionCSV(s);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"\'=SUM(A1)"');
  expect(csv).toContain('"123.45"');
  expect(csv).toContain('"Ada, ""hello""\n₦"');
  expect(csv).toContain('"-2500.00"');
});
