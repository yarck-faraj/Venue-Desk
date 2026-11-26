import { lsnap, pend } from "./listener-state.js";
import { $ } from "../utils/dom.js";
import { stopDataListeners, trackDataListener } from "../state/subscriptions.js";
import { S, ui } from "../state/store.js";
import { isoDay, today } from "../domain/dates.js";
import { isOwner, myOutlet, role } from "../state/session.js";
import { fs } from "./sdk.js";
import { queueRender, render } from "../app/render.js";
import { migrateSecrets } from "./migrate-secrets.js";
import { toast } from "../components/toast.js";

export function syncState() {
  const n = Object.values(pend).reduce((a, b) => a + b, 0),
    off = !navigator.onLine,
    d = $("#dot"),
    t = $("#syncTxt");
  if (!d || !t) return;
  d.classList.toggle("off", off || n > 0);
  d.title = off ? "Offline" : "Online";
  t.textContent = off ? (n ? "Offline · " + n + " not yet sent" : "Offline") : n ? "Saving " + n + "…" : "";
}

export function stopWatch() {
  stopDataListeners();
  Object.keys(S).forEach((k) => {
    S[k] = Array.isArray(S[k]) ? [] : {};
  });
  Object.keys(pend).forEach((k) => delete pend[k]);
  syncState();
}

export function watchAll() {
  ui.watchDay = today();
  ui.migrated = false;
  Object.keys(lsnap).forEach((k) => delete lsnap[k]);
  const r = role(),
    ob = myOutlet(),
    cutoff = isoDay(new Date(Date.now() - 100 * 864e5));
  const centre = ["bookings", "spaces", "rooms", "stays", "clients", "payments"],
    bar = ["outlets", "products", "stock", "sales", "shifts"];
  const names =
    r === "cashier"
      ? bar
      : r === "manager"
        ? centre
        : r === "owner"
          ? [...centre, ...bar, "vendors", "expenses", "expenseCategories", "stockCosts", "crewPay"]
          : [];
  names.forEach((n) => {
    let ref = fs.collection(n);
    if (n === "sales" || n === "shifts")
      ref = r === "cashier" ? ref.where("date", "==", today()) : ref.where("date", ">=", cutoff);
    if (r === "cashier" && ["products", "stock", "sales", "shifts"].includes(n))
      ref = ref.where("outletId", "==", ob);
    trackDataListener(
      ref.onSnapshot(
        { includeMetadataChanges: true },
        (snap) => {
          S[n] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          pend[n] = snap.docs.filter((d) => d.metadata && d.metadata.hasPendingWrites).length;
          syncState();
          const first = !lsnap[n];
          lsnap[n] = 1;
          if (first || snap.docChanges().length) queueRender();
          migrateSecrets();
        },
        (e) => {
          console.error(n, e);
          if (e && e.code !== "permission-denied")
            toast("Live updates stopped (" + n + "): " + String(e.message || e.code).slice(0, 120));
          if (e && e.code === "permission-denied")
            toast(
              isOwner()
                ? "The database rules on the server are out of date (" +
                    n +
                    "). Run: firebase deploy --only firestore:rules"
                : "No permission to load " + n,
            );
        },
      ),
    );
  });
  trackDataListener(
    fs.doc("settings/venue").onSnapshot(
      (s) => {
        S.venue = s.exists ? s.data() : {};
        render();
      },
      () => {},
    ),
  );
  trackDataListener(
    fs.doc("settings/oldSales").onSnapshot(
      (s) => {
        S.oldSales = s.exists ? s.data() : {};
        queueRender();
      },
      () => {},
    ),
  );
}
