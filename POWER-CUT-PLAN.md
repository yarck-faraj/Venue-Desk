# Power cuts and lost connectivity

Keep a printed copy at the till and at reception. Have a numbered paper ticket book available.

## While power or connectivity is unreliable

1. Use the same signed-in device and browser profile. Keep the till, printer and router on backup power where available. Avoid private browsing and clearing browser storage.
2. Finished transactions can queue locally when Firestore offline persistence is available. The sync indicator can show **Offline**, a count of pending writes, or **Saving** with a count. Keep the original device available until staff can reconcile its records.
3. When an item or quantity appears in **Current sale**, the till has saved that edit on this device. After a restart, reopen the same site and browser profile, sign in as the same cashier and open **Sell** at the same outlet. The draft reappears with its sizes, quantities and prices. **Clear** and a submitted checkout retire the draft. If the till reports a storage error, keep a paper ticket for the edit. For a handoff to another device, copy the draft to paper first.
4. When the till cannot finish a sale, record the ticket number, items, amount, payment method and time in the paper book. Keep one copy for the manager.

## When power returns

1. Reopen the same browser profile, reconnect the network and allow synchronization. For each completed or interrupted payment, check **Receipts** and match the amount, method and time against the paper ticket before entering another sale.
2. For a current-day sale missing from Receipts, enter it once in **Sell** and mark the paper ticket with the receipt number or staff initials. Ask the manager to reconcile earlier dates before entering them. Historical paper-sales entry follows the outlet cutoff in SETUP.md.
3. Reconcile cash and other payment methods against **Today** before closing the shift. Record any unresolved discrepancy for the owner.

## At the till

Each staff member uses their own sign-in. While the till shows pending writes, leave the browser open. If you need a backup phone or tablet, check which receipts have reached it before starting another sale. Use mobile data where available, and record the handoff in the paper ticket book.

## Owner checks

Keep a current full backup from **More** and review activity for voids and till differences. Each month, test the recovery procedure on the staging project with a test till, including a full restart while offline. Repeat on the browsers staff actually use, and verify scheduled backups and point-in-time recovery in SETUP.md section 9. See `docs/MANUAL-CHECKS.md` for the device checklist.
