# Lynn's Event Center (Venue Desk): Firebase setup (about 15 minutes)

You get: one web address that opens the event center's system on any phone or computer, staff sign-in, live sync between devices, offline support, installable like an app.

## 1. Create the Firebase project
1. https://console.firebase.google.com > **Add project** (e.g. `venue-desk-clientname`). Google Analytics off.
2. On the project home click the web icon `</>`, give it a nickname, skip the hosting checkbox.
3. Copy the `firebaseConfig` values into `public/firebase-config.js`. **For Lynn's this is already filled in (project `lynns-event-center`). Compare the apiKey in the file with the one in the Firebase console character by character (O vs 0 look alike); a single wrong character means sign-in fails.**

## 2. Turn on sign-in and the database
- **Build > Authentication > Get started > Email/Password > Enable.**
- **Build > Firestore Database > Create database**, a region near the venue, **production mode**.

## 3. Publish

```sh
npm install
npx firebase login
npx firebase use <your-project-id>
npm run deploy
```

Run these commands from the repository root as the authorized release operator. Check the active project with `npx firebase use` before publishing. The build writes the site into `dist/`. The classic script in `public/firebase-config.js` supplies its Firebase client configuration.
This also publishes `firestore.rules`. The site is available at `https://<your-project-id>.web.app`.

## 4. First sign-in (the owner)
1. Open the address, type the owner's email and a password, tap **Create account**.
2. The app says there is no owner yet: tap **Set up ... as owner**. Then open **More > Venue settings** to set the venue name, currency, phone code and address, and **More > Halls and spaces** to add each hall.
3. Lock sign-up: **Authentication > Settings > User actions**, untick **Enable create (sign-up)**. Do this only AFTER step 5 below, because staff need to create their accounts first.

## 5. Add staff (and choose their role)
1. Owner: **More > Staff access > + Add staff**. Type the person's **name** (e.g. Ama) and a password of at least 6 characters, pick the role, and for a cashier pick their bar. They sign in with just their name and that password. (A real email address also works.)
2. **Forgot password?** Staff who sign in by name have no mailbox, so there is no "email me a link". Instead the owner taps **Reset password** next to their name in Staff access and types a new one. The person is signed out everywhere and logs in again with it. This needs the `resetStaffPassword` function deployed (`firebase deploy --only functions`) and `VD_REGION` in `public/firebase-config.js` to match the function region.
3. When everyone is added, do the sign-up lock in 4.3.

| Role | Sees | Can't |
|---|---|---|
| **Cashier** (one per bar, tied to one outlet) | That bar's till, receipts and today's totals; starts and closes the day for that bar | Payments, expenses, costs, reports, other bars, voiding sales |
| **Manager** (event center) | Bookings, calendar, rooms and stays, clients, payments received, prices (read only) | Changing prices, expenses, crew pay, bar sales, reports |
| **Owner** | Everything: prices, costs, expenses, crew pay, stock, reports | |

## 6. First-day setup
1. **More > Outlets**: make sure the three bars exist (Golden Bean Café, Cocktails, Bites).
2. **More > Products and prices**: import or add what each bar sells. Tap a product to set its stock quantity, reorder level and cost.
3. Create one cashier per bar (section 5). Each cashier taps **Start the day** (cash float) and **Close the day** with a count at the end; differences show in the owner's Reports.

## What is in this version
- Bookings: halls, double-booking warning, holds, payments, balances, invoices, crew, checklists, server-side pricing (weekday/weekend)
- Rooms: overnight stays priced per night (weekday/weekend rates, Saturday and Sunday count as weekend)
- Till: touch product grid, search and barcode scanning, cash (with change), mobile money, card, receipts (print / WhatsApp), no selling at zero stock
- Stock: per outlet, reorder levels, restock and adjust, owner reorder list
- Owner Reports: cash in vs costs, profit, outlets, products, staff, voids, till differences
- Works on PC, tablet and phone, installable, works offline, CSV export

## 7. Guest rooms (overnight accommodation)
1. **Rooms tab** > **Add a room**: name/number, type (Standard, Executive, Suite…), **weekday price and weekend price per night** (weekend = Saturday and Sunday nights; leave the weekend price blank to use the weekday price), sleeps, housekeeping status. Only the owner can change prices. Meeting and conference rooms stay under **More > Halls and spaces** (hourly bookings).
2. **+ New stay**: guest name, phone, ID number, room(s), check-in and check-out dates, price override per night (owner only; blank = room rates), discount. **The price is calculated on the server, night by night**: each room at its weekday or weekend rate for that night, so a Friday to Monday stay is 1 weekday + 2 weekend nights. Deploy `functions` after changing this (it uses `functions/pricing.js`). One stay can hold several rooms. A warning appears if a room is already taken for those nights.
3. Views: **Today** (arrivals, departures due, rooms right now, rooms to clean), **Stays** (in-house / reserved / owing / past / cancelled, with search), **Timeline** (14-day board per room; tap an empty cell to book it).
4. **Check in** (warns if the room is not clean), **Check out** (warns about unpaid balance; leaving early frees the remaining nights and marks the room "needs cleaning"), **Mark clean** when housekeeping is done.
5. **Guest bill** = room charge (weekday and weekend nights listed separately) + extra charges (laundry, extra bed…) + bar/restaurant items charged to the room − discount − payments. In the POS, pick the in-house guest and tap **Charge to room**. Print the bill or send it by WhatsApp.
6. Reports show occupancy, room revenue, guests staying and unpaid guest bills.

## 8. Security checklist (do all of these before go-live)
1. **Lock sign-up** (Authentication > Settings > User actions > untick *Enable create*) after every staff member has made their account.
2. Everyone gets their **own login**. Never share the owner login on the tills. Use passwords of 10+ characters; the owner should also turn on a screen lock on the phone.
3. After deploying, open **Firestore > Rules** and confirm the published rules show today's date. Deploy again with `npm run deploy` whenever `firestore.rules` changes.
4. In **Google Cloud Console > APIs & Services > Credentials**, open the browser API key and under *Application restrictions* choose **Websites**, then add `https://lynns-event-center.web.app/*` and `https://lynns-event-center.firebaseapp.com/*`. This stops others reusing the key.
5. In Firebase **Project settings > Usage and billing**, set a **budget alert** so an unexpected spike emails the owner.
6. Staff leave? **More > Staff access > Edit > Delete** removes their access immediately. Also disable them under Authentication > Users.
7. The app has a **security headers** setup in `firebase.json` (no framing, no sniffing, HTTPS only).
8. The **Activity log** (owner only, More > Activity log) records voids, discounts, deletions, stock adjustments, refunds, till differences, checkouts with unpaid bills, staff changes and restores. Filter by **period** (today, 7/30/90 days, 1 year, or custom dates), by **staff member**, by **action**, or search the text. Export the filtered list to Excel. Nobody, including the owner, can edit or delete entries from the app.
   **How long are logs kept?** Until an administrator deletes them in the Firebase console. Nothing is removed automatically, and the storage cost is tiny. Each entry also carries an expiry date 2 years ahead, which only matters if you switch on a Firestore *TTL policy* for the `audit` collection (field `expireAt`) to auto-delete after 2 years. Ask the accountant how long business records must be kept before turning that on. Backups include the log.

## 9. Data safety and backups
- **Weekly backup:** owner opens **More > Backup and restore > Download full backup**. It saves one `.json` file with everything (bookings, sales, stays, stock, the activity log). Save a copy to a flash drive and to email/Google Drive. The Home screen reminds the owner after 7 days.
- **Restore:** **More > Backup and restore > Restore from backup file**. It puts back every record in the file (same-ID records are overwritten; nothing else is deleted).
- **Server-side protection (recommended):** in Google Cloud, upgrade the project to the pay-as-you-go plan (usually pennies at this size, with a budget alert) and enable **Firestore > Disaster recovery > Scheduled backups** (daily, kept 7+ days) and **Point-in-time recovery**. This protects against a bad restore or mistaken mass deletion even if nobody downloaded a file. Check Google's current pricing first.
- Money records cannot be deleted by managers or staff, only by the owner, and every delete is logged.

## 10. Power cuts and no internet
See **POWER-CUT-PLAN.md** (print it and put it by the till).

## 11. Changing roles, removing staff, deleting outlets
- **Promote / demote:** More > Staff access > **Change role**. It takes effect on that person's device within seconds, with no sign-out needed.
- **Staff leaves or is fired:** More > Staff access > Change role > **Remove access**. They are locked out of all data immediately. Also open Firebase console > Authentication > Users, find them and choose **Disable account** (this stops them signing in at all).
- **The owner's role** cannot be changed in the app. To hand the business to a new owner, ask the developer to change `ownerEmail` in the `settings/staff` document in the Firebase console.
- **Delete an outlet:** More > Outlets > **Delete**. It removes the outlet and its products. Past sales and reports are kept. Stock items are not deleted.

## 13. Developer access and testing
- **Do not use the owner's login to debug.** Use a separate test project:
  1. In the Firebase console create a second project (e.g. `lynns-event-center-test`), turn on Email/Password sign-in and Firestore, and put ITS config in your local copy of `public/firebase-config.js`.
  2. Run `npx firebase use lynns-event-center-test`, confirm the staging project, then run `npm run deploy`. Sign up with your own email; you become the owner of the TEST project and can fill it with fake data.
  3. Keep the real project's config only in the version you deploy to the client. Use `firebase use` aliases (`firebase use --add`) so the right project is chosen on each deploy.
- To look at the live project, the owner adds your Google account in Firebase console > Project settings > Users and permissions (e.g. **Viewer**). You can then inspect data in the console and check Authentication, without any app login. Ask the owner first, because the data is theirs.
- Open the browser DevTools console (F12) on any device to see errors; the app logs failures there.

## Known limits (good to tell the owner)
- Profit is cash basis (money in minus expenses and crew pay). Stock purchases count when recorded as expenses.
- POS history in the app covers the last 100 days (older data stays in the database).
- Cost per unit and crew pay are stored in owner-only collections, so cashiers and managers cannot read them even with technical tools.
- One stock item per product. Recipe-level (ingredient) tracking was dropped on purpose.
- Printing to the Xprinter and the cash drawer is built but must be checked on the real tablet (USB, Bluetooth or RawBT).
- Online payments, SMS, a customer-facing booking page and online-travel-site sync are still future work.

## 14. Barcode scanning at the till (v18)
- **Camera:** cashier taps **Scan** next to the search box, points the tablet camera at a bottle's barcode and the item is added to the sale with a beep. The camera stays open so several items can be scanned in a row; **Done** closes it. A product with sizes closes the camera and opens its size list. A barcode that is not on this bar's menu shows a red message and adds nothing.
- **USB / Bluetooth scanner:** it types the code and presses Enter in the search box; Enter now adds the matching item.
- **Setting barcodes:** the owner types or scans each bottle's number into **More > Products > (product) > Barcode**. One barcode per product, per bar. UPC-A and EAN-13 versions of the same code match.
- **How it reads:** Chrome's built-in detector is used when the tablet has it, otherwise the bundled decoder `public/zxing.min.js` (Apache-2.0, see `zxing.LICENSE.txt`) is loaded the first time the camera is used. The camera needs the site on HTTPS and the camera permission allowed for it.

## 15. Stock for bottled and packed items (v19)
- **Counting an item:** owner opens **More > Products**, taps a product, sets **Count stock for this item = Yes**, then types **Stock on hand**, **Reorder level** (warn at or below this), the **usual reorder quantity** and, optionally, the **cost per unit**. Saving creates the stock record. Prepared drinks (lattes, smoothies) are normally left uncounted.
- **Stock screen (More > Stock, owner only):** items grouped by outlet, each with an OK / Reorder / Out of stock badge. A **Reorder now** panel at the top (and on the owner Home) lists everything at or below its reorder level. Tap an item to **Restock** (optionally records an expense tagged to that outlet), **Adjust** (wastage, breakage, staff meal, count correction) or **Edit / count**. The search box filters the list as you type.
- **No selling at zero:** the till refuses to add more of an item than is in stock (button, camera scan and keyboard scanner alike), checkout checks again, and `firestore.rules` rejects any till write that would take a stock quantity below zero. Only the owner can change stock quantities outside of sales.
- **Costs are owner-only (v20):** cost per unit is stored in `stockCosts/{stockId}`, which `firestore.rules` lets only the owner read. Sales no longer carry a cost figure either.
- **If the owner sees "rules on the server are out of date":** run `firebase deploy --only firestore:rules` (or the full deploy). The app and `firestore.rules` must be deployed together.

## 16. Owner-only crew pay, receipt numbers, one-time clean-up (v20)
- **Crew pay:** the booking form asks the owner for `Name, Role, Pay` and the manager for `Name, Role` only. Pay is stored in `crewPay/{bookingId}` (owner-only in the rules), matched to crew by name and role. If the manager renames a crew member, the owner re-enters that person's pay. A third column typed by a manager is ignored.
- **Receipt numbers:** `GB-261104-007` = bar (GB Golden Bean, CT Cocktails, BT Bites), date as YYMMDD, then 001, 002... counted from that bar's receipts for the day. A saved tab keeps its number when it is paid. A gap in the sequence means a receipt is missing and is worth asking about.
- **First owner sign-in after updating:** the app moves any stock cost, crew pay and sale cost figures saved by older versions out of the documents that cashiers and managers can read, and records "privacy clean-up" in the activity log. It runs once and is safe to repeat. Deploy `firestore.rules` and hosting together, then open the app as the owner before the cashiers and manager use it.
- **Old backups:** restoring a backup made before v20 puts the old figures back; the next owner sign-in cleans them again.

## 17. "Something will not save": Check setup (v21)
Owner: **More > Check setup**. It shows who the app thinks you are (signed-in email, owner on file, role) and tests reading every collection and saving a test record in the owner-only ones, listing each failure with the server's error code. `permission-denied` means the rules published on the server are not the ones in this folder: run `firebase deploy --only firestore:rules`, then check Firestore > Rules in the console shows today's date. Red problem messages now stay on screen for 9 seconds and stack instead of hiding each other.


## 18. Housekeeping (v22)
- The old tabs, kitchen board, charge-to-event and charge-to-room code was removed. Bar sales are always paid on the spot.
- The owner Home shows the 7-day backup reminder again.
- Sales rules tightened: cashiers can only create paid sales for their own bar; only the owner can void or correct a sale.
- **Deploy** (rules, functions and hosting together): `npm run deploy` after confirming the active project


## 19. Old (paper) sales (v23)
Sales written in the paper books before the app took over can be typed into the system, but only for days **before** a cut-off date, so that every sale from then on comes from the app.
- **Where:** each cashier has an **Old sales** tab beside Sell / Receipts / Today (their own bar only). The event center manager has an **Old sales** tab. The owner has **More > Old sales (paper records)** for the event center and every bar.
- **Cashier / bar entries:** pick the date, then either **Day total** (cash, mobile money and card totals for that day) or **Item by item** (pick from the menu or type an item, quantity, price each, and how it was paid). Prices are typed because old prices may differ from today's.
- **Event center entries:** date, what it was for (hall or event, room stay, other), client or guest, description or receipt number, amount received, and how it was paid. They are saved as old payments, so they appear under Payments and in the owner's Reports, but they are never attached to a booking.
- **The cut-off date** (the first day the app records sales). Days on or after it cannot be logged. It is, in this order:
  1. the date the owner typed under **More > Old sales > Change cut-off date** (per bar and for the event center), else
  2. the first day the app was used for real: the first day a cashier tapped **Start the day** for that bar, or the first real payment recorded for the event center, else
  3. today (the app has not been used yet, so only earlier days can be logged).
  Logging stays open for days before the cut-off even after the app is in use, so the paper books can be finished later. **Before handing over, delete any test shifts and test payments, and type the real go-live date as the cut-off.** If the owner sets a cut-off later than the first real app day, the app warns that the days in between could be counted twice.
- **Checked on the server:** entries are validated and saved by the `oldSales` function, and `firestore.rules` refuses any direct write of an old record from a cashier or manager. The function must be deployed (it needs the same Blaze plan as the password reset): `npm run deploy` after confirming the active project.
- **What old records do not touch:** stock, till shifts and cash counts, the day's receipt numbering (old records are numbered `OLD-GB-261230-XXXX`), and the staff sales table (they show as "paper records (old sales)"). They do count in Reports totals, sales by outlet and payment-method totals for the period they fall in.
- **Mistakes:** only the owner can delete an old record (More > Old sales > Delete); the cashier then logs it again. Each logging and each delete is recorded in the Activity log. **Download (Excel)** on that page gives the full list for a bar or the event center.
- **Reports window:** the owner's Reports screen still looks back 100 days for POS sales. Older logged sales are all listed and totalled per month under More > Old sales.
- **Back-dating is blocked at the server too:** `firestore.rules` only accepts a cashier's normal sale if its `date` and `paidDate` are today, up to 3 days back (a till that was offline keeps the sale's own day and syncs later), or tomorrow (clock slack). A sale outside that window is refused and no stock is taken. If a cashier sees "Could not save sale ... date and time", the tablet's clock is wrong: set date and time to automatic and ring the sale again. To allow longer offline spells, add days to the list in `dayOk()` in the rules. Payments recorded by the manager are **not** limited this way on purpose, because a deposit taken before go-live has to be recorded with its real date against its booking.
- **After deploying the rules, ring up one test sale on a cashier login before handing over** (and one more with the tablet offline, then back online). If sales are refused, redeploy the previous rules (`firebase deploy --only firestore:rules` from the v23 folder) and tell the developer.
