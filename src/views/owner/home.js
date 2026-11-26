import { S, ui } from "../../state/store.js";
import { entName, money, ownerHome } from "../../state/selectors.js";
import { filterButtons } from "../../components/seg.js";
import { kpi } from "../../components/kpi.js";
import { esc } from "../../utils/dom.js";
import { stockState } from "../../domain/stock.js";
import { fq, num } from "../../domain/money.js";
import { isOwner } from "../../state/session.js";
import { lastBackup } from "../../state/persist.js";

export function vOwnerHome() {
  const E = (ui.oh = ui.oh || { per: "today" });
  const { ent, shared, inc, out } = ownerHome(E.per);
  return (
    backupBanner() +
    `<div class="bar"><div class="seg">${filterButtons(
      [
        ["today", "Today"],
        ["month", "This month"],
        ["year", "This year"],
      ],
      E.per,
      "ohPer",
    )}</div></div>
  <div class="kpis">${kpi("Income", money(inc))}${kpi("Expenses", money(out))}${kpi("Left over", money(inc - out), inc - out < 0 ? "neg" : "pos")}</div>
  ${ent.map((e) => `<div class="card"><h2>${esc(e.name)} <span>${money(e.inc)}</span></h2><div class="s">${esc(e.sub)}</div><div class="row"><div class="grow s">Expenses tagged to this business</div><div class="amt neg">${money(e.exp)}</div></div><div class="row"><div class="grow s">Left over</div><div class="amt ${e.inc - e.exp < 0 ? "neg" : "pos"}">${money(e.inc - e.exp)}</div></div></div>`).join("")}
  ${(() => {
    const need = S.stock.filter((i) => stockState(i) !== "ok").sort((a, b) => num(a.qty) - num(b.qty));
    return need.length
      ? `<div class="card"><h2>Reorder now <span class="neg">${need.length}</span></h2>${need
          .slice(0, 6)
          .map(
            (i) =>
              `<div class="row tap" data-a="stockItem" data-id="${i.id}"><div class="grow"><div class="t">${esc(i.name)}</div><div class="s">${esc(entName(i.outletId))} · ${fq(i.qty)} left, reorder at ${fq(i.low)}</div></div><div class="amt neg">${num(i.reorderQty) ? "Order " + fq(i.reorderQty) : stockState(i) === "out" ? "Out" : "Low"}</div></div>`,
          )
          .join(
            "",
          )}<div style="margin-top:8px"><button class="btn alt sm" data-a="goStock">Open stock${need.length > 6 ? " (all " + need.length + ")" : ""}</button></div></div>`
      : "";
  })()}
  <div class="card"><h2>Shared expenses <span>${money(shared)}</span></h2><div class="s">Light, water and other costs not tagged to one business.</div></div>`
  );
}

/* ---------- backup, restore, activity log ---------- */
function backupBanner() {
  if (!isOwner()) return "";
  const lb = lastBackup();
  if (lb && Date.now() - new Date(lb).getTime() < 7 * 864e5) return "";
  return `<div class="warn">${lb ? "It has been over a week since the last backup." : "No backup has been downloaded yet."} <button class="btn gold sm" data-a="backup" style="margin-left:6px">Download backup now</button></div>`;
}
