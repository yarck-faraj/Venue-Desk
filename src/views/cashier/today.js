import { money, shiftStats } from "../../state/selectors.js";
import { esc } from "../../utils/dom.js";
import { METHODS } from "../../config/constants.js";
import { num } from "../../domain/money.js";
import { printerCard } from "./printer-card.js";

export function cashierToday(sh, tot, paid) {
  const st = sh ? shiftStats(sh) : { by: {}, expected: 0 };
  return `<div class="cxday"><div class="cxcard"><h2 style="margin:0">Today's sales</h2><div class="cxbig">${money(tot)}</div><p>${paid.length} sale${paid.length === 1 ? "" : "s"}</p>${Object.entries(
    st.by,
  )
    .map(([m, v]) => `<div class="cxrow"><span>${esc(METHODS[m] || m)}</span><b>${money(v)}</b></div>`)
    .join("")}</div>
    <div class="cxcard"><h2 style="margin:0 0 8px">End of day</h2>${!sh ? "<p>The day has not been started.</p>" : sh.closedAt ? `<p>Closed at ${new Date(sh.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Cash counted ${money(sh.counted)}${Math.abs(num(sh.diff)) > 0.004 ? " (difference " + money(sh.diff) + ")" : ", balanced"}.</p>` : `<p>Cash expected in the drawer: <b>${money(st.expected)}</b></p><button class="cxbtn" data-a="closeShift">Close the day</button>`}</div>${printerCard()}</div>`;
}
