# Pokette Budgette V3 implementation report

## Outcome

V3.0.0 is implemented for local testing. No public deployment, external service, paid service, or reset-credit action was performed. Financial records retain the V2 schema and storage key; this release does not rebuild the ledger or reset saved workspaces.

## Stage A — Protect

- Added versioned local JSON backups of every active budgeting collection, theme and dashboard preference, with application/version/timestamp metadata.
- Imports validate size (10 MB), schema, dates, integer amounts, relationships, statuses and unsafe object keys before showing a preview. Explicit confirmation replaces personal records; cancel is read-only. Safety export is offered before replacement.
- The financial workspace is one localStorage write. Appearance keys are separate because localStorage has no multi-key transaction; caught failures roll preferences back. A process/browser crash between preference and workspace writes can leave appearance preferences changed, but cannot leave half a financial workspace.
- CSV includes UTF-8 BOM, quoted multiline text, exact two-decimal NGN amounts, reversal state and loan/receipt links. Formula-like text is neutralized. Expenses are negative, transfers appear once, and CSV is not a full backup.
- Files: src/data/backup.ts, src/components/DataPrivacy.tsx and their tests.
- Gate: 46 existing/domain tests plus 2 restore interaction tests passed; production build passed.

## Stage B — Privacy and demo

- More contains plain-language privacy information and a temporary Try Demo Budget workspace. Demo records and edits remain in memory. Exit/reload returns to saved records without overwriting them; restored demo backups also open temporarily.
- Existing legacy saved demo workspaces are preserved and labelled, not silently deleted or converted.
- Explicit clear removes the active budgeting records and the old migration recovery copy; downloaded backups remain the user's responsibility.
- Files: src/data/useWorkspace.ts, src/data/storage.ts, src/App.tsx, src/components/DataPrivacy.tsx, src/data/useWorkspace.test.tsx.
- Gate: 50 tests and production build passed.

## Stage C — Understand

- More → Open Reports provides income/spending, category percentages, planned items versus actual spending, recurring commitments, current goals and current safe-to-spend.
- Date filters: month to date, last month, last 3 calendar months to date, year to date and validated custom dates.
- Promises, reversed entries and transfers are excluded from ordinary income/spending. Loans/repayments are separately included in cash-flow totals. Gifts and actual receipts retain existing definitions.
- Planned items use due dates; spending uses transaction dates. Undated plans are explicitly excluded from period comparisons but remain reserved. Current goals/balances are clearly labelled as today's values, not historical snapshots.
- Charts have readable table alternatives and are suppressed when balances are hidden. Empty periods show guidance. Insights are computed locally from records.
- Files: src/domain/reports.ts, src/components/Reports.tsx, related tests, src/navigation/useNavigation.ts, src/App.tsx.
- Gate: 53 tests and production build passed before subsequent interface checks.

## Stage D — Personalize

- Light/Dark/System appearance remains available and persists. Simple/Detailed dashboard preference is saved and included in backups.
- Existing custom categories, icons and pastel colors remain available. Currency stays NGN; there is no misleading conversion toggle.
- Files: src/data/preferences.ts, src/components/Appearance.tsx, src/theme.test.tsx, src/App.tsx.
- Gate: 55 tests and production build passed.

## Stage E — Polish and final validation

- Unpaid checklist controls now show a clock, paid controls a tick, cancelled controls a cross, with matching accessible labels.
- Dialogs restore keyboard focus; tables scroll within their container on narrow screens. Existing touch targets, native dialogs, reduced motion, dark palette and update confirmation remain in place.
- Reports load lazily; chart dependencies are split from the main app. Main JS reduced from roughly 616 kB to 309 kB, with a separate roughly 402 kB chart bundle. Full app assets and local fonts remain precached for offline operation.
- Desktop SVG favicon plus 32px PNG fallback; 180px Apple touch icon; 192px and 512px Android/PWA icons, including maskable. All are generated from the same pocket-and-heart SVG.
- App/package/backup metadata use 3.0.0, with hashed build assets and the existing update discovery lifecycle. The footer identifies the active build.
- Final automated gate: 56 tests passed across 14 files; TypeScript and production build passed. Existing financial, persistence, cross-tab, navigation and service-worker lifecycle tests remain included.

## Still requires device testing

The browser automation runtime fails during initialization (kernel assets path error). No new visual screenshots or actual Safari/Android installation claims are made.

Before friends use real financial data, verify on iPhone Safari and Android Chrome:
1. Install over HTTPS; verify icon, safe areas, small-screen forms, tables, light/dark appearance and keyboard focus.
2. Export a sample JSON backup, cancel an import, then restore it on another device and compare balances. Check CSV in the chosen spreadsheet app.
3. Enter/exit demo and confirm personal records remain untouched.
4. Wait for Offline ready, disconnect, reopen the app, add an expense, and revisit Reports.
5. Reconnect, receive an update banner without a manual refresh, and apply it after saving forms.

No reachable HTTPS deployment exists yet. The local 127.0.0.1 URL is not a phone-accessible address. Hosting, authentication/access controls and hosting request logs must be reviewed when deployment is authorized.
