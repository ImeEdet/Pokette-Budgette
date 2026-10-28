# POKETTE BUDGETTE V3
## Protect, Understand & Personalize
### Implementation Specification for Codex

**Application:** Pokette Budgette  
**Target version:** V3  
**Product philosophy:** Budgeting should feel simple, visual, approachable, and free from judgment.

## PRIMARY OBJECTIVE

Upgrade the existing Pokette Budgette application from V2 to V3 without rebuilding it or compromising existing financial records.

V3 should introduce:

1. Reliable backup, restore, and CSV export.
2. Clear privacy information and safe demo functionality.
3. Useful financial reports and spending insights.
4. More user customization.
5. Accessibility, mobile responsiveness, offline reliability, and performance improvements.

The application remains a **local-first personal budgeting tool**. It does not hold real money, connect to bank accounts, process payments, or upload users' financial records to an application server.

Inspect the existing repository, architecture, data models, storage implementation, service worker, PWA configuration, and tests before changing anything.

Preserve the existing V2 features, visual identity, and beginner-friendly experience.

**Important:** Work incrementally. Do not consume reset credits or initiate paid services without explicit approval.

---

# PHASE 1 — BACKUP, RESTORE & DATA SAFETY

This is the highest-priority phase.

## 1.1 Complete Backup

Add an **Export Backup** action under More → Data & Privacy.

Export a downloadable JSON file containing all user-owned budgeting information, including:

- Wallets and balances
- Transactions and payment records
- Categories and budgets
- Recurring bills and subscriptions
- Expected income and partial receipts
- Loans, gifts, and repayments
- Savings goals and progress
- Relevant preferences and settings
- Any additional persistent records used by the existing app

Use a versioned backup schema.

Include metadata such as:
- Application name
- Backup schema version
- Creation timestamp
- Exporting app version

Do not include passwords, secrets, service-worker caches, or unrelated browser data.

Generate the backup locally. Do not transmit it to a server.

## 1.2 Restore Backup

Add an **Import Backup** action.

Before changing existing records:

1. Read and parse the selected file locally.
2. Validate its structure and supported schema version.
3. Verify relationships and references between records.
4. Reject malformed, unsupported, or unsafe data.
5. Show a preview of the backup contents.
6. Explain that restoring may replace existing data.
7. Require explicit confirmation.

For V3, implement a reliable **replace-existing-data** restore flow rather than an unsafe automatic merge.

Before replacing data, offer to export a safety backup of the current records.

Restore should be atomic where supported: validation must finish before replacement, and a failed restore must not leave a partially restored budget.

Provide clear success and error feedback.

## 1.3 Cross-Device Portability

Ensure users can export a backup on one device and restore it on another supported device.

Do not imply automatic synchronization.

Explain clearly:

"Your budget is stored on this device. Export a backup to keep a copy or move your data to another device."

## 1.4 CSV Export

Add CSV export for transaction and payment history.

Include relevant fields such as:
- Date
- Wallet
- Category
- Description
- Amount
- Transaction type
- Relevant status

Use correct CSV escaping, consistent dates, and appropriate character encoding.

Support Nigerian naira and other configured currencies without corrupting amounts.

CSV is for analysis and portability; it is not a replacement for the complete JSON backup.

---

# PHASE 2 — PRIVACY, SAFETY & DEMO MODE

## 2.1 Privacy Information

Create a simple, readable **Your Data & Privacy** page.

Explain in plain language:

- Financial records are stored in the user's browser/device.
- Pokette does not currently require a bank connection.
- Pokette does not move or hold money.
- Records are not automatically synchronized across devices.
- Clearing browser storage may delete records.
- Other people using the same browser profile may be able to access saved information.
- Exported backups and screenshots may contain private financial details.
- Pokette does not currently provide app-level encryption or user authentication.

Describe the actual implemented behavior. Inspect dependencies, hosting, and network requests before making definitive privacy claims.

Do not promise absolute security or privacy.

## 2.2 Demo Mode

Introduce a clearly labeled **Try Demo Budget** option.

Use fictional financial information, including:
- Sample wallets
- Sample income
- Sample expenses
- Sample recurring bills
- Sample savings goals

The demo should illustrate how Pokette works without requiring users to enter real financial information.

**Critical:** Demo data must not overwrite or mix with the user's real records.

Use an isolated demo workspace or another reliably separated mechanism.

Allow users to exit demo mode safely.

Clearly distinguish demo records from real records throughout the interface.

## 2.3 Data Controls

Provide clear controls for:
- Exporting a backup
- Importing a backup
- Exporting CSV
- Viewing storage/privacy information
- Deleting local budgeting records

Deleting records must require explicit confirmation and explain the consequences.

Do not silently clear user data.

---

# PHASE 3 — FINANCIAL REPORTS & INSIGHTS

Introduce a **Reports** section that turns existing financial records into useful visual information.

## 3.1 Dashboard Reports

Support:

**Income vs Expenses**
- Compare recorded income and expenses over time.
- Distinguish actual receipts from expected income.
- Do not count unpaid expected income as received money.

**Spending by Category**
- Show how spending is distributed across categories.
- Support clear amounts and percentages.
- Provide a text-based alternative to charts.

**Monthly Overview**
- Total income received
- Total expenses
- Net cash flow
- Relevant outstanding commitments
- Savings progress

**Budget vs Actual**
- Compare planned category allocations with actual spending.
- Show remaining or exceeded amounts.

**Recurring Commitments**
- Summarize upcoming bills and subscriptions.
- Distinguish paid, unpaid, overdue, and upcoming items using existing status rules.

## 3.2 Date Filters

Support useful time periods:
- This month
- Last month
- Last 3 months
- This year
- Custom date range, if feasible within the existing architecture

Ensure date handling is consistent and avoids timezone-related misclassification.

## 3.3 Safe-to-Spend Integration

Preserve the existing safe-to-spend calculation.

Reports must use the same underlying financial definitions as the dashboard.

Do not independently recalculate balances with conflicting formulas.

If necessary, centralize shared calculation logic.

## 3.4 Friendly Insights

Provide concise, factual observations such as:

- "Transport was your largest spending category this month."
- "You've used 75% of your food budget."
- "Your recurring commitments total ₦X this month."
- "You're making progress toward your savings goal."

Insights must be based on actual recorded data.

Do not invent transactions, forecasts, or financial outcomes.

Avoid shame-based wording, alarmist language, or unsupported financial advice.

No external AI service is required.

## 3.5 Empty States

When there is insufficient data, show friendly guidance instead of misleading charts.

Example:

"Not much to report yet. Add a few transactions and Pokette will help you spot patterns."

---

# PHASE 4 — CUSTOMIZATION

Extend existing preferences without making the interface complicated.

## 4.1 Appearance

Support:
- Light mode
- Dark mode
- System theme

Preserve the existing Pokette visual identity.

If theme support already exists, extend or improve it rather than replacing it.

## 4.2 Financial Preferences

Where appropriate, support:
- Preferred currency
- Number and date formatting
- Custom categories
- Category icons or colors
- Optional dashboard section ordering or visibility

Do not assume changing the displayed currency converts financial values.

If currency conversion is not implemented, explain that the preference changes formatting only and avoid misleading mixed-currency totals.

## 4.3 Personalization

Allow users to choose how much detail they see.

For example:
- Simple dashboard
- Detailed dashboard

Keep the default experience beginner-friendly.

Do not introduce complicated configuration screens for minor preferences.

---

# PHASE 5 — ACCESSIBILITY & MOBILE POLISH

## 5.1 Mobile Responsiveness

Test the application at:
- 320px
- 375px
- 430px
- Tablet widths
- Desktop widths

Verify:
- No horizontal overflow
- No clipped cards
- Readable figures
- Touch-friendly buttons
- Accessible dialogs
- Responsive reports and charts
- Usable backup/import controls
- Correct keyboard behavior on forms

## 5.2 Accessibility

Improve:
- Semantic labels
- Keyboard navigation
- Focus visibility
- Screen-reader descriptions
- Color contrast
- Reduced-motion preferences
- Error messages
- Non-color indicators for important statuses

Do not rely on color alone to communicate financial information.

## 5.3 Offline Reliability

Preserve the existing PWA functionality.

Ensure users can continue using core budgeting features offline.

Backup export should work offline where browser capabilities permit.

Do not require internet access for local financial calculations or reports.

## 5.4 Update Banner

Preserve and verify the existing automatic Update app banner.

Requirements:
- Detect available app updates without requiring a manual page refresh, subject to browser and service-worker lifecycle constraints.
- Work on desktop and supported installed mobile PWAs.
- Avoid repeated or false update notifications.
- Activate updates safely.
- Do not interrupt active data entry without appropriate safeguards.
- Display the correct application version after updating.

Version all relevant PWA assets and caches consistently.

Do not claim an installed app has updated until the new version is active.

---

# PHASE 6 — DATA INTEGRITY & TESTING

## 6.1 Existing Data

Preserve all existing V2 data.

Any required schema migration must:
- Be versioned
- Be tested
- Preserve existing records
- Avoid duplicate transactions
- Avoid changing historical balances unexpectedly
- Provide a recovery strategy

Do not reset or overwrite existing financial records during development.

## 6.2 Financial Accuracy

Add tests covering:
- Wallet balances
- Income and expense totals
- Transfers between wallets
- Recurring bills
- Partial income receipts
- Loan repayments
- Gifts
- Savings contributions
- Safe-to-spend calculations
- Reports and date filtering

Ensure transfers and other internal movements are not incorrectly counted as income or spending.

Preserve the existing application's accounting conventions and document any necessary corrections.

## 6.3 Backup & Restore Tests

Verify:
- Valid backups export correctly.
- Exported backups restore correctly.
- Restored balances match originals.
- Invalid backups are rejected.
- Unsupported backup versions are handled safely.
- Cancelled restores leave existing data unchanged.
- Failed restores do not cause partial data loss.
- Demo records never contaminate real records.
- CSV exports preserve amounts and descriptions.
- Data remains available after reload.

## 6.4 Quality Gates

After each phase:
1. Run existing tests.
2. Add targeted regression tests.
3. Run TypeScript checks where applicable.
4. Run the production build.
5. Check for unintended file changes.
6. Report incomplete functionality.

The existing 38 passing tests are the baseline, not a ceiling.

Do not mark a feature complete solely because the build succeeds.

---

# IMPLEMENTATION ORDER & CREDIT MANAGEMENT

Implement in the following order:

**Stage A:** Backup, restore, and CSV export.

**Stage B:** Privacy information, isolated demo mode, and data controls.

**Stage C:** Financial reports and insights.

**Stage D:** Customization.

**Stage E:** Accessibility, performance, offline behavior, and final regression testing.

At the end of each stage, provide:
- Completed features
- Files changed
- Tests added and passed
- Known limitations
- Remaining work

If the available execution allowance is insufficient, stop at a clean, tested checkpoint.

Do not rush unfinished features, silently remove scope, or consume reset credits.

Do not deploy publicly or share the application with external testers without explicit approval.

---

# FINAL ACCEPTANCE CRITERIA

V3 is complete when:

1. Users can safely back up and restore their budgeting data.
2. Financial records can be exported as CSV.
3. Users understand where their data is stored and its limitations.
4. Demo mode works without touching real records.
5. Reports accurately reflect existing financial data.
6. Safe-to-spend remains consistent with the dashboard.
7. Customization persists.
8. The application remains usable on small screens.
9. Core budgeting functions work offline.
10. The automatic update banner continues working.
11. Existing V2 records remain intact.
12. All tests and production builds pass.
13. No unapproved paid services, reset credits, or public deployment are used.

Provide a final implementation report identifying what was verified automatically and what still requires physical-device testing.

**Pokette Budgette should help people understand their money—not make managing it feel like another problem.**