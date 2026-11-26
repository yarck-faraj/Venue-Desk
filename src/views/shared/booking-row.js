import { balanceOf, money, spaceColor, spaceName } from "../../state/selectors.js";
import { esc } from "../../utils/dom.js";
import { fmtRange } from "../../domain/dates.js";
import { live } from "../../domain/bookings.js";

/* ---------- views ---------- */
export function bookingRow(b, showBal) {
  const bal = balanceOf(b);
  return `<div class="row tap" data-a="open" data-id="${b.id}">
    <div style="width:6px;align-self:stretch;border-radius:3px;background:${spaceColor((b.spaceIds || [])[0])}"></div>
    <div class="grow"><div class="t">${esc(b.title)}</div>
    <div class="s">${esc(fmtRange(b))}<br>${esc((b.spaceIds || []).map(spaceName).join(" + "))}${b.clientName ? " · " + esc(b.clientName) : ""}</div></div>
    <div style="text-align:right"><span class="badge b-${b.status}">${b.status}</span>${showBal && live(b) && bal > 0 ? `<div class="amt neg" style="margin-top:4px">${money(bal)} due</div>` : ""}</div></div>`;
}
