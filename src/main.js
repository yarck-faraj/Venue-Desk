import { registerDispatcher } from "./actions/dispatcher.js";
import { registerViews } from "./app/render.js";
import { vHome } from "./views/home.js";
import { vCal } from "./views/shared/calendar.js";
import { vBookings } from "./views/shared/bookings.js";
import { vMoney } from "./views/shared/money.js";
import { vOverview } from "./views/owner/reports.js";
import { vExpenses } from "./views/owner/expenses.js";
import { vMore } from "./views/owner/more.js";
import { vOldOwner, vOldTab } from "./views/shared/old-sales.js";
import { vStayTab } from "./views/shared/stays.js";
import { vPrices } from "./views/manager/prices.js";
import { vClients } from "./views/shared/clients.js";
import { renderCashier } from "./views/cashier/shell.js";
import { initFirebase } from "./firebase/init.js";
import { startAuth } from "./firebase/auth.js";
import { scanClose } from "./hardware/scanner.js";
import { $ } from "./utils/dom.js";

registerDispatcher();

registerViews({
  home: vHome,
  cal: vCal,
  book: vBookings,
  money: () => vMoney(vOverview, vExpenses),
  more: () => vMore(vOldOwner),
  stay: vStayTab,
  prices: vPrices,
  clients: vClients,
  old: vOldTab,
  cashier: renderCashier,
});

/* ---------- boot ---------- */
if (initFirebase()) {
  startAuth(scanClose);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
} else {
  $("#auth").hidden = false;
  $("#authForm").innerHTML =
    "<p>Firebase is not set up yet. Paste your project settings into <b>public/firebase-config.js</b> (see SETUP.md).</p>";
}
