import { BookOpen } from "lucide-react";

export function BeginnerGuide({ go }: { go: (page: string) => void }) {
  return (
    <section
      className="panel beginner-guide"
      aria-labelledby="beginner-guide-title"
    >
      <span className="sticker lavender">
        <BookOpen aria-hidden="true" />
      </span>
      <span className="handwritten">a gentle place to begin ♡</span>
      <h2 id="beginner-guide-title">New to budgeting? Start here.</h2>
      <p>
        A budget is a list of intentions for your money. You don’t need perfect
        numbers or a plan for everything to begin.
      </p>
      <ol className="guide-first-steps">
        <li>
          <strong>Add your money.</strong> Create a wallet for each bank account
          and for cash. Enter the balance you have now.
        </li>
        <li>
          <strong>Plan one thing.</strong> In Budget, choose “Add something to
          pay”. Give it a name, a category, and an estimated amount.
        </li>
        <li>
          <strong>Record what happens.</strong> When you pay, mark the item paid
          and choose the wallet you used. Change the estimate to the actual
          amount if needed.
        </li>
      </ol>
      <div className="inline-actions">
        <button className="button secondary" onClick={() => go("Wallets")}>
          Open my wallets
        </button>
        <button className="button secondary" onClick={() => go("Budget")}>
          Make a little plan
        </button>
      </div>

      <details>
        <summary>
          Wallets, categories, and budget items—what’s the difference?
        </summary>
        <p>
          A <strong>wallet</strong> is where your money is: your bank account,
          cash, or a savings account. Pokette records what you enter; it does
          not connect to your bank or send payments.
        </p>
        <p>
          A <strong>category</strong> groups similar things. Subscriptions is a
          category; Spotify and ChatGPT are individual{" "}
          <strong>budget items</strong> inside it. NEPA can sit under
          Electricity and utilities.
        </p>
        <p>
          Your opening balance is a starting point. Don’t add that same money
          again as income. Use a transfer when moving money between your own
          wallets.
        </p>
      </details>
      <details>
        <summary>What if I don’t know how much I’ll spend?</summary>
        <p>
          An estimate is enough for food, transport, or groceries. Add a
          specific item such as “This week’s groceries”, then enter the actual
          amount when you pay.
        </p>
        <p>
          If you spend on something you hadn’t planned, use “Record an expense”.
          You don’t need to make a plan first. A budget item currently records
          one payment; use separate items for separate trips or shopping visits.
        </p>
        <p>
          Plans can change. “Cancel item” removes an unpaid item from your
          planned spending without taking money from a wallet. You can restore
          it later.
        </p>
      </details>
      <details>
        <summary>How do I avoid counting a payment twice?</summary>
        <p>
          For an item on your list, use <strong>Mark paid</strong>. Choose its
          wallet and actual amount, then confirm. Pokette adds the expense to
          Transactions for you.
        </p>
        <p>
          If you already recorded that expense, select it under “Payment record”
          instead of creating a new expense. It must be an unlinked expense in
          the same category.
        </p>
        <p>
          Made a mistake? Edit, reverse, or delete the transaction in
          Transactions. Reversing a payment restores the wallet amount and makes
          its linked item unpaid again. Marking something paid in Pokette
          records a payment you made—it does not pay the provider.
        </p>
      </details>
      <details>
        <summary>What do accessible, reserved, and safe to spend mean?</summary>
        <p>
          <strong>Accessible</strong> is the balance in wallets you’ve marked as
          available to use. Money in an inaccessible wallet still exists, but is
          left out of this total.
        </p>
        <p>
          <strong>Reserved</strong> is money set aside for unpaid plans and
          savings goals. Unpaid items across all dates count, even when you’re
          viewing just one month. Any older category limits you kept can also
          reserve money.
        </p>
        <p>
          <strong>Safe to spend = accessible money − reserved money.</strong>{" "}
          For example, ₦20,000 accessible with ₦5,000 reserved leaves ₦15,000.
          This reflects only what you’ve entered, so missing bills or expenses
          won’t be included.
        </p>
        <p>
          A negative amount means your recorded plans exceed the money
          available. You can adjust the plans; it isn’t a judgement.
        </p>
      </details>
      <details>
        <summary>When should I use the extra planning tools?</summary>
        <p>
          <strong>Recurring bills:</strong> add subscriptions or regular bills
          once. Pokette creates unpaid items through the end of the current
          month when you open it. It never deducts money automatically. Pausing
          stops new additions; existing items stay on your list.
        </p>
        <p>
          <strong>Expected income:</strong> write down promised money, then
          record each amount as it arrives. Expected money does not increase
          your wallet balance. A recurring income source still needs a separate
          expectation for each payment.
        </p>
        <p>
          <strong>Loans and gifts:</strong> record money already lent, borrowed,
          given, or received. Record repayments as they happen. Loan movements
          are kept out of ordinary spending.
        </p>
        <p>
          <strong>Savings goals:</strong> set aside money already in a wallet.
          Setting aside, releasing, or reallocating a goal changes your plan,
          not your bank balance. Use Wallets to record actual transfers between
          accounts.
        </p>
      </details>
      <details>
        <summary>Using Pokette on a phone or without internet</summary>
        <p>
          Use the navigation along the bottom to switch between Dashboard,
          Wallets, Budget, Transactions, and More. Start with one wallet and one
          plan; the extra tools can wait.
        </p>
        <p>
          Open “Install on iPhone or Android” in the planner section below for
          home-screen instructions. The current computer-only preview needs a
          reachable secure address before it can be installed on another phone.
        </p>
        <p>
          After the app says <strong>Offline ready</strong>, you can reopen it
          and record changes without internet on that device. Reconnect to
          receive app updates, and finish any unsaved forms before choosing
          “Update & reload”.
        </p>
        <p>
          Records stay in this browser or installed app. They do not
          automatically sync between your phone and computer, or between
          different browsers. Clearing website data can erase them. A
          backup can be exported in More → Your Data & Privacy. Keep a private copy before changing devices or clearing storage.
        </p>
      </details>
    </section>
  );
}
