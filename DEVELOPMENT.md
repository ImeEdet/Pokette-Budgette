Current release: **3.0.0**. See [V3_IMPLEMENTATION.md](V3_IMPLEMENTATION.md) for the current implementation, validation, limitations, and mobile test checklist. Earlier milestone notes below are historical.

# Pokette V3 development

Run `npm install`, `npm run dev` and open the printed localhost URL. `npm test` runs domain and interaction checks; `npm run build` type-checks and builds into dist. Use Node 24 LTS (tested with 24.22.1); the test runner supports Node 22.12+, 24, or 26+.

Architecture: `src/domain` owns typed records, integer-kobo arithmetic and ledger mutations; `src/data` owns versioned local persistence and fixture creation; React components render derived values. No saved balance caches exist. Stable UUIDs link records. Schema v2 includes planning records and rejects unknown versions. V1 is migrated with a pure validated transform; the original JSON is copied to pokette.backup.before-v2 before the first V2 write. The storage key remains pokette.workspace.v1 to preserve the browser origin and existing records.

Financial conventions: NGN only in Phase 1. Opening balances may be negative. Income/expense/transfer amounts must be positive. Overdrafts are permitted and shown. Accessible totals include accessible archived wallets (archiving must not erase money). Reservations include all unpaid item estimates (known actual totals take precedence). For each category, reserve the larger of unpaid items or its remaining active legacy allocation, preventing double counting. Cancelled and paid items do not reserve item amounts. Plans never debit a wallet. Budgets are explicit dated periods; they do not silently renew. Purchased actual amount is a total, while estimate is per unit. Future-dated cash transactions are rejected. Transfers affect neither income nor spending. Reversing or deleting a linked expense restores its purchase to purchased/unpaid. Paid actions are idempotent.

Demo is opt-in and stored as an explicitly labeled workspace. Switching to fresh requires confirmation and replaces demo records. Phase 2 includes expected income and partial receipts, loans and gifts, recurring bills and savings goals. New demo workspaces include fictional examples of these features. Existing workspaces are never seeded with new demo data. Phase 3 reports, exports, currency conversion and external services remain excluded.

Local data belongs to this browser and origin, does not sync between devices, and can be lost if browser data is cleared. Storage write failure leaves the previous state intact. Balance hiding is visual privacy, not encryption.

## Windows preview

Double-click `start-pokette.cmd`, keep its terminal open, and visit http://127.0.0.1:5173/. The launcher uses the Node installation at `C:\Program Files\nodejs` when it is not on PATH. Dependencies are already installed in this checkout; on a new checkout run `npm ci` first. Stop the server with Ctrl+C. Always use the same browser and URL to access the same local workspace.

## Validation completed

- Production build and TypeScript checks passed.
- 56 tests passed, covering domain arithmetic, data validation, persistence failures, conflicting-tab writes, navigation, offline update lifecycle, the simplified budget flow, and the complete Phase 1 acceptance workflow.
- Updated Vitest to 5.0.5 after reviewing dependency advisories; installation audit reported zero vulnerabilities.
- Browser checks at 1440px desktop and 390px phone widths found no horizontal overflow. A demo transfer preserved total money, and wallet balances persisted after reload. Browser error/warning logs were empty.
- Vite emits a non-blocking warning for the 560 kB application bundle (173 kB gzip). Bundle splitting can be addressed during the later performance phase.
- `docs/preview.png` shows the fictional demo dashboard. No application was deployed.

## Item-based budget flow (user clarification, 28 October 2026)

The user's clarified workflow supersedes category-first planning in the original specification. Categories organize individual things to pay for: Spotify and ChatGPT under Subscriptions, NEPA under Electricity, and estimates for everyday costs. Budget opens to the payment list grouped by category. A month selector uses item due dates, undated items remain visible, and earlier unpaid items remain accessible. Completed and cancelled items are expandable. These totals describe list items, not all monthly transaction spending.

Adding an item requires its name, category, and estimate. Optional details retain existing quantities, priority, dates, and notes. Mark paid opens the existing wallet/actual-payment form and creates or links one expense; repeated payment remains idempotent. Cancel and restore do not alter wallet balances. One-off spending can be recorded directly as an expense. Phase 2 planning tools sit in expandable sections below the payment list.

The dashboard no longer shows budget category pockets. Existing IDs, records, and legacy category limits are preserved without migration; limits are available in optional category settings. Unpaid items across all dates reserve money, including items in archived categories. A remaining legacy limit may still reserve money after an individual item is cancelled.

Responsive layouts and offline caching remain in place. Browser visual verification is pending because the browser automation runtime cannot initialize. Automated tests cover grouping, cancellation/restoration, date visibility, actual payments, ledger preservation, and legacy-limit reservation compatibility.

## Mobile and offline preview

`start-pokette.cmd` builds and serves the production app on port 5173. After its first successful load and offline-ready confirmation, the service worker caches the app and local fonts. Updates require an explicit reload action in More; local records remain in browser storage. Development uses port 5174 with the service worker disabled. Keep using the same origin for existing records.

Offline reload was verified with the preview server stopped before the budget redesign. Physical iPhone and Android installation testing remains pending. Phone installation requires a reachable HTTPS host; this local-only milestone does not deploy one or synchronize devices.

## Phase 2 financial rules

- Expected income is a plan. Each receipt is a linked ordinary income transaction; received totals and statuses derive from live transactions, including edits and reversals. Inaccessible wallets remain excluded from accessible money. Recurring income sources are labelled; users plan each expected receipt explicitly because amounts and dates may vary.
- Loan principal and repayments use signed wallet ledger entries with dedicated links. They are excluded from ordinary spending and income filters. Gifts remain identified cash inflows or expenses. Repayments cannot exceed outstanding principal. Remove repayments before removing a principal payment. History is derived, never stored as a balance cache.
- Bills generate deterministic checklist IDs through the end of the current month when opening/saving the app. The next due date advances with a retained month-end anchor. Weekly, monthly, annual and custom-day intervals are supported. Pausing preserves already-created items; resuming catches up from the next due date. Schedule edits affect future additions. Deleting a generated item does not recreate it after the cursor has advanced. Only explicit payment changes wallet balances.
- Goals use reserved allocations linked to wallets, not extra cash transactions. Set aside, release, and reallocate actions validate available wallet holdings and preserve total cash. Goals in inaccessible wallets are not subtracted again from safe-to-spend. Spending can subsequently leave a goal underfunded; the UI shows that shortfall. Move physical funds with ordinary wallet transfers first.
- Migration and backup failures preserve existing saved bytes. Cross-tab conflict checks still apply. V2 contains no deployment or connected service.

## V2 verification

Domain and interaction tests cover migration/backup failure, partial and inaccessible receipts, loan repayments/edits/reversals, gifts, date boundaries, idempotent recurring generation/payment, pause, goal allocations/reallocation, and saved form workflows. Browser automation currently fails to initialize, so a new visual pass and physical iPhone/Android verification remain pending. Existing responsive styles and offline service-worker lifecycle tests are retained.

Update discovery runs every 60 seconds while the app is visible and online, and on focus, visibility changes and reconnection. Checks never apply an update or reload a form automatically. Hidden/offline checks are skipped, overlapping requests are suppressed, failures retry quietly, and listeners/timers are removed on unmount. The existing dashboard/More banner offers the detected update.

## Appearance checkpoint (V3 customization only)

More offers Light, Dark and System appearance, persisted separately in pokette.appearance.v1. Future V3 backups should include this preference. System changes and cross-tab preference changes update the active palette. The initial HTML sets appearance before React renders. CSS color tokens cover both stylesheets; wallet cards and category accents have dark variants. Reduced-motion preferences disable animations/transitions. Theme changes do not migrate or modify financial records.

43 tests and the production build pass. Primary body, muted text, button, positive and negative text combinations were checked mathematically at >=4.5:1 contrast; this is not a complete accessibility audit. Browser automation remains unavailable, so visual and physical-device theme review remains pending. The supplied full specification is saved as POKETTE_V3_SPEC.md. Backup/restore, isolated demo, reports and the remaining V3 stages have not been implemented in this appearance checkpoint.
