import { type State } from "../domain/model";
import { migrateState, validateState } from "../domain/validation";
import { type Theme } from "../theme";
export const APP_VERSION = "3.1.0";
export type Backup = {
  app: "Pokette Budgette";
  schemaVersion: 1;
  createdAt: string;
  appVersion: string;
  workspace: State;
  preferences: { theme: Theme; dashboard: "simple" | "detailed" };
};
export function makeBackup(
  workspace: State,
  theme: Theme,
  dashboard: "simple" | "detailed" = "detailed",
): Backup {
  validateState(workspace);
  return {
    app: "Pokette Budgette",
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    workspace,
    preferences: { theme, dashboard },
  };
}
export function parseBackup(raw: string): Backup {
  if (raw.length > 10_000_000)
    throw new Error("This backup is too large (maximum 10 MB).");
  const b = JSON.parse(raw, (key, value) => {
    if (["__proto__", "prototype", "constructor"].includes(key))
      throw new Error("Unsafe backup content.");
    return value;
  }) as Backup;
  if (
    !b ||
    b.app !== "Pokette Budgette" ||
    b.schemaVersion !== 1 ||
    typeof b.appVersion !== "string" ||
    typeof b.createdAt !== "string" ||
    !Number.isFinite(Date.parse(b.createdAt)) ||
    !b.preferences ||
    !["system", "light", "dark"].includes(b.preferences.theme) ||
    !["simple", "detailed"].includes(b.preferences.dashboard)
  )
    throw new Error("This is not a supported Pokette backup.");
  return { ...b, workspace: migrateState(b.workspace) };
}
export function transactionCSV(s: State) {
  const quote = (value: string, protect = true) =>
    '"' +
    (protect && /^[\s]*[=+\-@\t\r]/.test(value)
      ? "'" + value
      : value
    ).replaceAll('"', '""') +
    '"';
  const rows = [
    [
      "Date",
      "Wallet",
      "To wallet",
      "Category",
      "Description",
      "Amount (NGN)",
      "Type",
      "Status",
      "Planning link",
      "Notes",
    ]
      .map((x) => quote(x))
      .join(","),
  ];
  for (const t of s.transactions) {
    const text = [
      t.date,
      s.wallets.find((w) => w.id === t.walletId)?.name ?? "",
      s.wallets.find((w) => w.id === t.toWalletId)?.name ?? "",
      s.categories.find((c) => c.id === t.categoryId)?.name ?? "",
      t.description,
    ];
    rows.push(
      [
        ...text.map((x) => quote(x)),
        quote(
          ((t.type === "expense" ? -t.amount : t.amount) / 100).toFixed(2),
          false,
        ),
        ...[
          t.type,
          t.reversed ? "reversed" : "recorded",
          t.link?.kind ?? "",
          t.notes,
        ].map((x) => quote(x)),
      ].join(","),
    );
  }
  return "\uFEFF" + rows.join("\r\n") + "\r\n";
}
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
