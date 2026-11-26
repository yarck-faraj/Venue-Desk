# Changelog

## Cloud Functions runtime moved from Node 20 to Node 22 (owner approved)

Google decommissioned the Node.js 20 runtime for Cloud Functions on 30 October 2026, after which functions on it cannot be created or updated and existing ones may be disabled. The only change is `"engines": {"node": "22"}` in `functions/package.json`. No function code changed. Deploy the functions once (`npx firebase deploy --only functions`) on a staging project first, then on production, and check password reset and old-sales logging. Node 22 itself is scheduled for deprecation on 30 April 2027, so plan a move to Node 24 next year.

## Dead-code clean-up (owner approved)

No visible or functional change; the full reference comparison still shows zero differences.

- Removed the unreachable "reception" branch from the payment form (C01).
- Removed the non-owner branches from the More screen, which only the owner can open (C02).
- Removed the duplicate `cartTotal` alias of `cartSub` in the domain layer (C03). Sales still store `discount: 0`.
- Merged the two `.toast` rules into one with the same computed styles (C05).
- Made 21 unused exports module-private (E01-E21) and removed unused imports, destructured variables and unused `catch` bindings.
- Kept on purpose because they affect behaviour or stored data: the `tab` payment label (C04), the two `change` listeners (C06), the cashier day rollover (C07), the expense booking lookup (C09).

## Service worker install is tolerant of an unreachable CDN

The precache change below made the worker fail to install if any of the four Firebase scripts hosted on the public CDN could not be fetched. The worker now requires every file of the application itself and treats the CDN scripts as best effort, so a CDN outage can no longer stop the till installing. Covered by a new browser test.

## Cashier cart recovery

Each cart edit now commits to the till's IndexedDB before the updated cart appears on screen. Signing in to the same outlet and browser profile restores the cashier's items, selected sizes, quantities and prices, including offline. Clearing the cart or submitting it at checkout retires the draft. The till detects edits in another tab before applying a stale change or payment. Compatible drafts from the earlier local-storage format can be restored.

## Earlier clean-up

- Removed an unused booking lookup from the payments list.
- Split the monthly crew-cost calculation into two ordered statements so the month initialization and addition are visible.
- Combined repeated imports in the paper-sales editor and the state selectors.

## VenueDesk modular refactor

Two intentional behaviour changes shipped in this refactor.

1. On installation, the service worker precaches the built application, its barcode decoder and the classic SDK scripts needed for startup. The build content determines the cache name, so a changed build replaces the previous cache.
2. Firebase Hosting sends a one-year immutable cache header for hashed files under `/assets/**`.

All other behaviour was preserved in the automated comparison. The measurements and test suite are kept in the full archive of this project. Checks that need physical equipment (printers, camera, installed app, power cut) are listed in README.md.
