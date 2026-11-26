import { entName, money, oldRows } from "../state/selectors.js";
import { isOwner } from "../state/session.js";
import { fmtDay } from "../domain/dates.js";
import { del } from "../firebase/writes.js";
import { audit } from "../firebase/audit.js";
import { S, ui } from "../state/store.js";
import { render } from "../app/render.js";

/* ---------- old paper sales: logged once, for days BEFORE the app took over ---------- */
// Everything is checked and saved on the server (functions/oldsales.js + the oldSales function). A day can only be
// logged if it is before the cut-off: the owner's date (More > Old sales), otherwise the first day the app was used
// for real (first till day for a bar, first payment for the event center), otherwise today.
export function oldDelete(ent, id) {
  const r = oldRows(ent).find((x) => x.id === id);
  if (!r || !isOwner()) return;
  if (!confirm("Delete this old record?\n\n" + fmtDay(r.date) + " · " + money(r.amount) + "\n" + r.desc))
    return;
  del(ent === "center" ? "payments" : "sales", id);
  audit("delete", "Old sale " + r.date + " " + money(r.amount) + " · " + entName(ent));
  if (ent !== "center") {
    ui.old.list[ent] = (ui.old.list[ent] || []).filter((x) => x.id !== id);
    S.sales = S.sales.filter((x) => x.id !== id);
  }
  render();
}
