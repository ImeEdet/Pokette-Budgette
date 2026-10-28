# POKETTE BUDGETTE ♡
## Product Specification & Development Instructions for ChatGPT Codex

**Project name:** Pokette Budgette  
**Short name:** Pokette  
**Tagline:** Little plans, big dreams ♡  
**Application type:** Responsive, local-first personal budgeting web application  
**Development approach:** Incremental, test-driven where practical, modular, and maintainable.

---

# 1. Your Role

Act as a senior full-stack software engineer, UI/UX designer, and quality assurance engineer collaborating with me on Pokette Budgette.

You are responsible for implementing working software, not merely generating mockups or describing potential implementations.

Before making significant changes:

1. Inspect the existing project and its dependencies.
2. Understand the relevant architecture.
3. Explain major implementation decisions when necessary.
4. Preserve working functionality.
5. Implement the requested feature.
6. Run appropriate checks and tests.
7. Fix errors discovered during implementation.
8. Summarize completed work, remaining limitations, and suggested next steps.

Do not rewrite large sections of working code unnecessarily.

Do not silently remove features, invent financial data, or claim something is functional when it is only a visual placeholder.

If requirements are ambiguous and the decision would significantly affect financial calculations or data integrity, ask for clarification.

# 2. Product Vision

Build **Pokette Budgette**, a beautiful, playful, reliable personal finance application combining:

- The organization of a modern financial dashboard.
- The charm of a pastel digital stationery collection.
- The familiarity of a handwritten personal planner.
- The practicality of a real budgeting and transaction management system.

Pokette should feel expressive, cozy, quirky, and delightful without sacrificing financial accuracy.

Its personality is warm, encouraging, and occasionally humorous, but never judgmental.

The target audience includes students, young adults, freelancers, irregular earners, and anyone who wants an approachable way to manage money.

**The core principle: Pokette must be useful before it is decorative.**

# 3. Technology Stack

Use the following stack unless an existing project provides a compelling reason to adjust it:

- React with TypeScript.
- Vite.
- Tailwind CSS.
- Lucide React for icons.
- Recharts for financial visualization.
- LocalStorage or IndexedDB for initial persistence.
- Modular components and reusable hooks.
- Vitest for automated unit testing.
- React Testing Library for component testing where appropriate.

Prefer established, maintained libraries over unnecessary custom dependencies.

Do not require:

- Paid APIs.
- Banking integrations.
- User authentication.
- A hosted backend.
- Cloud infrastructure.

Version 1 must work locally without an account.

Design the application so authentication, cloud synchronization, and optional bank connections can be introduced in future versions without requiring a complete rewrite.

# 4. Brand Identity

## Visual direction

Imagine a colorful digital planner filled with sticky notes, handwritten reminders, pastel tabs, playful stickers, and carefully organized financial information.

The design should be playful but not childish, polished but not corporate.

### Color palette

- Lavender: `#DCC9F5`
- Blush pink: `#F8CBDD`
- Sage green: `#C8E5CE`
- Warm cream: `#FFF2D9`
- Soft peach: `#FFD5B7`
- Deep plum for primary text.
- Warm off-white for backgrounds.

Use these colors harmoniously. Maintain sufficient contrast for important information.

Avoid generic fintech blue gradients, sterile dashboards, and excessive visual clutter.

### Typography

Use the following font families:

- **Fredoka:** Primary headings, prominent figures, and category names.
- **Patrick Hand:** Handwritten labels and casual notes.
- **DynaPuff:** Occasional decorative headings.
- **Caveat:** Small handwritten annotations.
- **Nunito:** Forms, transactions, financial details, and dense information.

Typography should feel expressive while remaining legible.

Never use decorative handwriting fonts for long transaction tables or important numerical information.

### Interface details

Incorporate:

- Rounded cards.
- Soft shadows.
- Subtle paper textures.
- Sticker-inspired category icons.
- Hand-drawn arrows and underlines.
- Decorative sticky notes.
- Small doodles.
- Friendly checklists.
- Thoughtful microinteractions.
- Gentle animations.

Decorations must never obstruct navigation, form inputs, or financial information.

Respect reduced-motion preferences.

### Branding

Use **Pokette Budgette** on the welcome screen, onboarding, and primary branding surfaces.

Use **Pokette** in compact navigation and casual interface text.

The wordmark should use lowercase `pokette budgette` with a playful handwritten or sticker-inspired accent.

# 5. Application Navigation

Provide five primary navigation destinations:

1. Dashboard
2. Wallets
3. Budget
4. Transactions
5. More

The More section should eventually contain:

- Income
- Loans & Gifts
- Subscriptions
- Savings
- Reports
- Settings

Use a desktop sidebar and mobile bottom navigation.

All detail pages must have clear navigation back to their parent section.

Ensure the layout works on mobile phones, tablets, laptops, and desktop screens.

# 6. Dashboard

Create a responsive financial overview featuring:

- Friendly greeting and current date.
- Total accessible balance.
- Hide/show balance control.
- Reserved money.
- Safe-to-spend amount.
- Expected income.
- Upcoming payments.
- Recent transactions.
- Spending overview.
- Clickable budget category cards.
- Quick actions to add income, expenses, and transfers.

The dashboard should feel like opening a beautiful personal planner.

Financial values must be calculated from actual application data, not hardcoded display values.

## Core calculations

**Safe to spend = accessible wallet balances − reserved allocations.**

Expected income must never increase available money before receipt.

Overdue income must not be treated as cash already received.

Planned expenses must not automatically reduce wallet balances.

Internal transfers must not be classified as income or expenses.

Savings movements must not be double-counted.

Negative balances and shortfalls must be displayed clearly.

# 7. Wallets and Accounts

Users must be able to create and manage multiple:

- Bank accounts.
- Cash wallets.
- Digital wallets.
- Savings accounts.

Each wallet should support:

- Name and type.
- Opening balance.
- Current balance.
- Currency.
- Accessibility status.
- Transaction history.
- Editing.
- Archiving.
- Transfers between wallets.

Internal transfers must update both source and destination balances accurately.

Use a centralized financial calculation layer rather than calculating balances independently in UI components.

# 8. Transactions

Build a searchable, filterable transaction management system.

Supported transaction types should include:

- Income.
- Expenses.
- Transfers.
- Loans.
- Repayments.
- Gifts.
- Savings movements.

Each transaction should have an appropriate date, amount, description, category, wallet association, and optional notes.

Support editing, deletion, and reversal with suitable confirmation.

Changes must update balances, category totals, and reports correctly.

Avoid duplicate records and inconsistent wallet balances.

Use integer minor units for monetary calculations to prevent floating-point rounding errors.

# 9. Budget Categories

Create customizable categories with individual detail pages.

Default categories:

- Transportation.
- Food and meals.
- Groceries and treats.
- Subscriptions.
- Electricity and utilities.
- Personal essentials.
- Technology and repairs.
- Family support.
- Emergency fund.
- Savings.
- Miscellaneous.

Each category should display:

- Name and sticker-inspired icon.
- Budget allocation.
- Actual spending.
- Remaining budget.
- Planned purchases.
- Paid expenses.
- Progress indicator.
- Notes.
- Relevant transactions.

Support category creation, editing, reordering, and archiving.

Support weekly, monthly, and custom budgeting periods.

Each category may use its own pastel accent color while maintaining consistent component layouts.

# 10. Planned Purchases and Checklists

Build a checklist-based purchase planning feature.

Each item should support:

- Name.
- Estimated amount.
- Actual amount.
- Quantity.
- Priority.
- Notes.
- Due date.
- Status.

Statuses:

- Planned.
- Purchased.
- Paid.
- Cancelled.

Financial rules:

- Planned purchases do not reduce wallet balances.
- Purchased items may remain unpaid.
- Paid items must link to or generate an actual expense transaction.
- Prevent duplicate expense transactions.
- Cancelled items must not count toward planned spending.

Display planned, committed, and paid totals separately.

Use friendly checkbox interactions and clear visual progress.

# 11. Irregular Income

Pokette must support people who receive money unpredictably rather than on a fixed salary schedule.

Income records should include:

- Source.
- Expected amount.
- Actual received amount.
- Expected date.
- Received date.
- Destination wallet.
- Notes.
- One-time or recurring status.

Support:

- Expected.
- Overdue.
- Partially received.
- Received.
- Accessible.

Support partial payments.

Money that has been received but remains inaccessible must not increase accessible balances.

Promised payments must not be treated as available funds.

# 12. Loans, Gifts, and Family Support

Create tools to distinguish:

- Money lent.
- Money borrowed.
- Gifts given.
- Gifts received.
- Partial repayments.
- Settled loans.

Track:

- Person.
- Amount.
- Date.
- Optional due date.
- Outstanding balance.
- Repayment history.
- Notes.
- Linked wallet transactions.

Loans must affect wallet balances without being incorrectly classified as ordinary consumption expenses.

Promised repayments must not count as accessible money.

# 13. Subscriptions and Bills

Support recurring obligations with:

- Name.
- Amount.
- Frequency.
- Next due date.
- Category.
- Paying wallet.
- Active or paused status.

Support weekly, monthly, annual, and custom schedules.

Upcoming bills should appear in financial planning without automatically deducting money before payment.

# 14. Savings Goals

Users should be able to create goals containing:

- Goal name.
- Target amount.
- Current progress.
- Optional deadline.
- Icon.
- Color.
- Linked wallet or reserved allocation.

Support deposits, withdrawals, and reallocations.

Savings transfers must not be incorrectly treated as ordinary expenses.

Use encouraging, nonjudgmental language.

# 15. Financial Reports

Create readable, friendly insights including:

- Spending by category.
- Income versus expenses.
- Weekly and monthly trends.
- Planned versus actual spending.
- Upcoming commitments.

Use Recharts with accessible labels and harmonious pastel colors.

Avoid shaming language or unnecessary financial assumptions.

# 16. Settings and Privacy

Provide:

- Default currency: Nigerian naira (NGN / ₦).
- Optional currency selection.
- Locale-aware number formatting.
- Balance visibility toggle.
- Theme preferences.
- Category customization.
- JSON backup export and import.
- CSV transaction export.
- Clear-data action with confirmation.

For the initial version, data remains on the user's device.

Explain clearly that local storage does not automatically synchronize between devices.

Hiding balances is a visual privacy feature, not encryption.

Do not introduce automatic currency conversion without an explicit exchange-rate mechanism.

# 17. First-Launch Experience

On first launch, offer two choices:

**Start Fresh**

Create an empty financial workspace with no fabricated personal financial records.

**Explore Demo**

Load clearly labeled fictional sample data showcasing:

- Multiple wallets.
- Irregular income.
- Transportation spending.
- Subscriptions.
- A planned purchase.
- A partially repaid loan.
- A savings goal.

Never silently mix demo data into real user data.

# 18. Data Architecture and Reliability

Use clear, documented domain models.

Separate:

- Financial domain logic.
- Data persistence.
- UI components.
- Navigation.
- Formatting utilities.
- Validation.
- Application state.

Financial calculations must be centralized and testable.

Use stable identifiers for records.

Include data schema versioning and a migration strategy for future updates.

Ensure edits, deletions, transfers, and imports preserve financial consistency.

Avoid unnecessary duplication of derived financial values.

Use sensible validation and error handling.

# 19. Accessibility and Responsive Design

Every visible interactive control must function.

Include:

- Accessible form labels.
- Keyboard navigation.
- Visible focus states.
- Helpful error messages.
- Empty states.
- Confirmation dialogs for destructive actions.
- Reduced-motion support.
- Responsive layouts.
- Readable charts.
- Sufficient text contrast.

Financial accuracy and accessibility take priority over decorative effects.

# 20. Development Roadmap

Do not attempt every feature in a single implementation pass.

## Phase 1 — Functional Foundation

Implement first:

- Project setup and architecture.
- Brand and design system.
- Responsive navigation.
- Dashboard.
- Wallet management.
- Income and expense transactions.
- Internal wallet transfers.
- Budget categories.
- Planned purchase checklists.
- Local persistence.
- Financial calculation utilities.
- First-launch experience.
- Basic automated tests.

**Phase 1 acceptance criteria:**

A user must be able to open Pokette, choose Start Fresh, create a wallet, add income, record an expense, transfer funds, create a budget, plan a purchase, and refresh the page without losing their data.

The dashboard and wallet balances must remain mathematically correct throughout.

The interface must work on desktop and mobile.

No primary Phase 1 button should be decorative or nonfunctional.

## Phase 2 — Financial Planning

Implement:

- Irregular income and partial receipts.
- Loans and gifts.
- Subscriptions and recurring bills.
- Savings goals.
- Related calculations and automated tests.

Ensure Phase 2 integrates with the existing transaction system without double-counting.

## Phase 3 — Insights and Polish

Implement:

- Financial reports.
- JSON backup and restore.
- CSV export.
- Advanced customization.
- Accessibility improvements.
- Performance optimization.
- Final UX refinement.

# 21. Testing Requirements

Write automated tests for important financial behavior.

At minimum, verify:

1. Adding income increases the correct wallet balance.
2. Recording an expense decreases the correct wallet balance.
3. Internal transfers preserve the total amount across wallets.
4. Planned purchases do not deduct money.
5. Marking a purchase as paid creates or links to exactly one expense.
6. Reserved money reduces safe-to-spend without being double-counted.
7. Expected income does not increase accessible money.
8. Editing and deleting transactions correctly updates balances.
9. Local data survives page refreshes.
10. Demo data remains clearly separated from real user data.

Run the build and relevant tests after significant changes.

Do not report success if tests fail.

# 22. Working with Me

I will be reviewing the application visually and functionally as we develop it.

When I request a change:

- Inspect the relevant files first.
- Preserve existing features unless removal is explicitly requested.
- Explain major tradeoffs when appropriate.
- Make focused, maintainable changes.
- Test the affected functionality.
- Tell me what changed.

Do not treat every new instruction as a request to rebuild the application.

Keep the codebase understandable so future improvements can be made without unnecessary complexity.

# 23. Brand Voice

Pokette should sound like a friendly, slightly whimsical organizer.

Examples:

- "Welcome to your little money corner ♡"
- "Let's see what's in your pockets."
- "A little planning goes a long way."
- "Your plans are looking lovely!"
- "Nothing here yet. A fresh little page!"
- "Your money, your pace."

Do not overuse cute phrases in serious financial situations.

Never shame users for spending, borrowing, or withdrawing savings.

# 24. Initial Execution Instructions

When you receive this specification:

1. Inspect the current workspace.
2. If the project is empty, scaffold the React, TypeScript, and Vite application.
3. Install the required dependencies.
4. Establish the folder structure and financial domain models.
5. Create a concise implementation plan for Phase 1.
6. Begin implementing Phase 1.
7. Run the build and relevant tests.
8. Fix issues within the implemented scope.
9. Provide the local launch instructions.
10. Report completed features, limitations, and the next logical development step.

Do not begin Phase 2 or Phase 3 until requested.

Do not deploy the application or connect external services without permission.

**Final product goal:** Pokette Budgette should feel like a personal digital stationery collection that helps people confidently manage real money.

*Little plans, big dreams ♡*