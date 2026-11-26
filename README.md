# VenueDesk (clean app folder)

This folder holds only what is needed to build and publish VenueDesk. The tests, the original app and the working notes are in the separate full archive.

| Item | What it is |
| --- | --- |
| `src/`, `index.html`, `vite.config.js`, `scripts/` | The app and its build |
| `public/` | Files copied as they are: `firebase-config.js` (your Firebase project settings), the web-app manifest, icons, barcode decoder |
| `firebase.json`, `firestore.rules`, `functions/` | Hosting settings, database security rules, server functions (now on Node 22) |
| `SETUP.md`, `POWER-CUT-PLAN.md`, `CHANGELOG.md` | Setup guide, printable power-cut plan, list of changes |

## 1. One-time computer setup

1. Install **Node.js** (the LTS version, 22 or newer) from https://nodejs.org. You do not need nvm.
2. Open a terminal (Windows: PowerShell. Mac: Terminal) and check it worked: `node -v` should print a number starting with 22 or higher.
3. In the terminal go to this folder, for example `cd Documents/venuedesk-app`, then run `npm install`. This takes a minute and creates a `node_modules` folder; ignore it.
4. Check the build works: `npm run build`. It creates a `dist` folder, which is the website.

## 2. Test on a separate staging project first

A staging project is a second, empty Firebase project used only for testing. Nothing you do there touches the real venue's data.

1. In https://console.firebase.google.com create a project such as `venuedesk-test`. Turn on **Authentication > Email/Password** and **Firestore Database** (production mode).
2. Functions need the **Blaze** (pay-as-you-go) plan. Test usage costs almost nothing.
3. Make a COPY of this whole folder called `venuedesk-staging`. In the copy, open `public/firebase-config.js` and paste the test project's settings from Project settings > Your apps. Never put the test settings in the real folder.
4. In the copy run:
   ```
   npx firebase login
   npx firebase deploy --project venuedesk-test
   ```
   Replace `venuedesk-test` with your test project's ID. This publishes the site, the security rules and the functions.
5. Open the address it prints (`https://venuedesk-test.web.app`). Create an account; you become the owner of the test project. Add a cashier and a manager and try the checks below.

## 3. Checks to do on staging before the real launch

- Sell something as a cashier, void it as the owner, log an old (paper) sale. Reset a staff password (this uses the functions).
- Print a receipt on each real printer (USB, Bluetooth or RawBT) and print an invoice from a computer.
- Scan a barcode with the camera and with a keyboard scanner.
- Install the app on a tablet, turn off the internet, reopen it, sell something, turn the internet on and confirm it syncs.
- Add an item to the cart, restart the tablet or close the browser, sign in again as the same cashier and confirm the cart came back.
- After you deploy a newer version, reopen the installed app and confirm it updates.
- Start from the power-cut plan in POWER-CUT-PLAN.md.

## 4. Publish for real

1. In this folder, confirm `public/firebase-config.js` has the real project's settings (`lynns-event-center`).
2. Publish the new website only (safest, nothing else changes): `npx firebase deploy --only hosting --project lynns-event-center`
3. Cloud functions need a one-time redeploy because Google switched off the Node 20 runtime on 30 Oct 2026. Do it on staging first, then: `npx firebase deploy --only functions --project lynns-event-center`. Afterwards check that resetting a staff password and logging an old sale still work. If either fails on the live project right now, this is why.
4. The security rules have not changed. Redeploy them only if you edit `firestore.rules`: `npx firebase deploy --only firestore:rules --project lynns-event-center`

## 5. Protect the Firebase API key

The key in `public/firebase-config.js` is visible to anyone who opens the site. That is normal for Firebase: it identifies the project and is not a password. Your data is protected by sign-in and `firestore.rules`. As an extra layer, in Google Cloud Console open APIs & Services > Credentials, open the browser key and add an HTTP referrer restriction for your site address (`https://lynns-event-center.web.app/*` and any custom domain). Also turn off account sign-up after your staff accounts exist (SETUP.md section 4).

## Daily commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the app on your computer for trying changes. It talks to whichever Firebase project is in `public/firebase-config.js`, so only use it with the staging settings |
| `npm run build` | Builds the website into `dist` |
| `npm run deploy:site` | Builds and publishes only the website. Add `-- --project YOUR_PROJECT_ID` to choose the project |
