import { myOutlet } from "../../state/session.js";
import { ui } from "../../state/store.js";
import { oldLoading } from "../shared/old-sales.js";
import { money, monthLabel, oldRows, oldStatus } from "../../state/selectors.js";
import { oldSum } from "../../domain/old-sales.js";
import { esc } from "../../utils/dom.js";
import { fmtDay } from "../../domain/dates.js";
import { OLD_METHODS } from "../../config/constants.js";

/* cashier tab */
export function cxOld() {
  const ent = myOutlet(),
    O = ui.old,
    st = O.st[ent];
  if (!st) return oldLoading(ent, true);
  const rows = oldRows(ent),
    sum = oldSum(rows),
    months = Object.keys(sum.months).sort().reverse();
  return `<div class="cxday"><div class="cxcard"><h2 style="margin:0 0 6px">Old paper sales</h2><p>${oldStatus(st)}</p>${O.err[ent] ? `<p style="color:#b3261e">${esc(O.err[ent])}</p>` : ""}<button class="cxbtn" data-a="oldOpen" data-ent="${esc(ent)}">Log old sales</button></div>
    <div class="cxcard"><h2 style="margin:0">Logged so far</h2><div class="cxbig">${money(sum.total)}</div><p>${sum.n} record${sum.n === 1 ? "" : "s"}</p>${months.map((k) => `<div class="cxrow"><span>${esc(monthLabel(k))}</span><b>${money(sum.months[k])}</b></div>`).join("")}</div>
    ${
      rows.length
        ? `<div class="cxcard"><h2 style="margin:0 0 8px">Latest records</h2>${rows
            .slice(0, 40)
            .map(
              (r) =>
                `<div class="cxrow"><span>${esc(fmtDay(r.date))} · ${esc(OLD_METHODS[r.method] || r.method)}<br><small>${esc(r.desc)}</small></span><b>${money(r.amount)}</b></div>`,
            )
            .join(
              "",
            )}<p><small>Made a mistake? Ask the owner to delete that record, then log it again.</small></p></div>`
        : ""
    }</div>`;
}
