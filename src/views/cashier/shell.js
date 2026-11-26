import { refreshWatchDay } from "../../firebase/watch-day.js";
import { byId, money } from "../../state/selectors.js";
import { myEmail, myOutlet, staff } from "../../state/session.js";
import { S, ui } from "../../state/store.js";
import { today } from "../../domain/dates.js";
import { num } from "../../domain/money.js";
import { $, esc } from "../../utils/dom.js";
import { filterButtons } from "../../components/seg.js";
import { cashierReceipts } from "./receipts.js";
import { cashierToday } from "./today.js";
import { cxOld } from "./old-sales.js";
import { cxSell } from "./sell.js";

export function renderCashier() {
  refreshWatchDay();
  const o = /** @type {Partial<import("../../state/models.js").NamedRow>} */ (
      byId("outlets", myOutlet()) || {}
    ),
    nm = (staff.names || {})[myEmail()] || myEmail(),
    mode = ui.cx || "sell";
  const sh = S.shifts.find((s) => s.date === today()),
    open = !!sh && !sh.closedAt,
    paid = S.sales.filter((s) => s.date === today() && s.status === "paid"),
    tot = paid.reduce((a, s) => a + num(s.total), 0);
  const ae = /** @type {HTMLInputElement | null} */ (document.activeElement),
    keep = ae && ae.id === "pq" ? ae.selectionStart : null;
  $("#tabs").style.display = "none";
  ui.pos.outlet = myOutlet();
  const nav = filterButtons(
    [
      ["sell", "Sell"],
      ["rec", "Receipts"],
      ["day", "Today"],
      ["old", "Old sales"],
    ],
    mode,
    "cxMode",
  );
  let body;
  if (mode === "rec") body = cashierReceipts();
  else if (mode === "day") body = cashierToday(sh, tot, paid);
  else if (mode === "old") body = cxOld();
  else body = cxSell(open, sh);
  $("#view").innerHTML =
    `<div class="cx"><header><div><b>${esc(o.name || "Lynn's")}</b><small>${esc(nm)}</small></div><nav>${nav}</nav><div class="cxtot">${money(tot)}<small>today</small></div><button class="cxout" data-a="signout">Sign out</button></header>${body}</div>`;
  if (keep !== null) {
    const e = $("#pq");
    if (e) {
      e.focus();
      e.setSelectionRange(keep, keep);
    }
  }
}
