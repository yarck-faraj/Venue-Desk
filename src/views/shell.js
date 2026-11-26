import { me, role, staff } from "../state/session.js";
import { $ } from "../utils/dom.js";
import { S, ui } from "../state/store.js";
import { ICONS } from "../components/icons.js";
import { byId } from "../state/selectors.js";
import { vDetail } from "./shared/booking-detail.js";
import { vStayDetail } from "./shared/stay-detail.js";

const tabsFor = () => {
  const r = role();
  return r === "cashier"
    ? [
        ["pos", "POS"],
        ["shift", "My shift"],
      ]
    : r === "manager"
      ? [
          ["home", "Home"],
          ["cal", "Calendar"],
          ["book", "Bookings"],
          ["stay", "Rooms"],
          ["prices", "Prices"],
          ["money", "Payments"],
          ["old", "Old sales"],
          ["clients", "Clients"],
        ]
      : r === "owner"
        ? [
            ["home", "Home"],
            ["cal", "Calendar"],
            ["book", "Bookings"],
            ["stay", "Rooms"],
            ["money", "Reports"],
            ["more", "More"],
          ]
        : [];
};

export function renderShell(views) {
  if (!me || !staff || $("#app").hidden) return;
  if (role() === "cashier") return views.cashier();
  $("#tabs").style.display = "";
  $("#venueName").textContent = S.venue.name || "Lynn's Event Center";
  $("#tabs").innerHTML = tabsFor()
    .map(
      ([k, l]) =>
        `<button class="${ui.tab === k ? "on" : ""}" data-a="tab" data-k="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>${l}</button>`,
    )
    .join("");
  const ae = /** @type {HTMLInputElement | null} */ (document.activeElement),
    keepId = ae && ae.id && ["q", "pq", "sq", "alq", "stq"].includes(ae.id) ? ae.id : null,
    keep = keepId ? ae.selectionStart : null;
  if (!tabsFor().some((t) => t[0] === ui.tab)) ui.tab = tabsFor()[0][0];
  $("#view").innerHTML = views[ui.tab]();
  if (keepId && $("#" + keepId)) {
    const el = /** @type {HTMLInputElement} */ ($("#" + keepId));
    el.focus();
    try {
      el.setSelectionRange(keep, keep);
    } catch {}
  }
  const b = ui.detail && byId("bookings", ui.detail);
  const sy = $("#sheet .sheet") ? $("#sheet .sheet").scrollTop : 0;
  const stDet = ui.stayDetail && byId("stays", ui.stayDetail);
  $("#sheet").innerHTML = b ? vDetail(b) : stDet ? vStayDetail(stDet) : "";
  if (b && sy) $("#sheet .sheet").scrollTop = sy;
}
