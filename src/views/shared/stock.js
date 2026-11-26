import { S, ui } from "../../state/store.js";
import { byId, entName, money, stockCost } from "../../state/selectors.js";
import { stockState } from "../../domain/stock.js";
import { fq, num } from "../../domain/money.js";
import { $, esc } from "../../utils/dom.js";
import { stockBadge } from "../../components/badge.js";
import { kpi } from "../../components/kpi.js";

export function vStock() {
  const q = (ui.stq || "").toLowerCase().trim(),
    all = S.stock.slice().sort((a, b) => a.name.localeCompare(b.name));
  const list = q ? all.filter((i) => (i.name + " " + entName(i.outletId)).toLowerCase().includes(q)) : all;
  const need = all.filter((i) => stockState(i) !== "ok").sort((a, b) => num(a.qty) - num(b.qty));
  const row = (i) =>
    `<div class="row tap" data-a="stockItem" data-id="${i.id}"><div class="grow"><div class="t">${esc(i.name)}</div><div class="s">Reorder at ${fq(i.low)}${num(i.reorderQty) ? " · usually order " + fq(i.reorderQty) : ""}${stockCost(i.id) ? " · " + money(stockCost(i.id)) + " each" : ""}</div></div><div style="text-align:right">${stockBadge(i)}<div class="amt ${stockState(i) !== "ok" ? "neg" : ""}" style="margin-top:4px">${fq(i.qty)} ${esc(i.unit || "")}</div></div></div>`;
  const known = new Set(S.outlets.map((o) => o.id)),
    groups = [
      ...S.outlets.map(
        (o) => /** @type {[string,typeof list]} */ ([o.name, list.filter((i) => i.outletId === o.id)]),
      ),
      /** @type {[string,typeof list]} */ (["Other", list.filter((i) => !known.has(i.outletId))]),
    ].filter((g) => g[1].length);
  return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button><span class="grow"></span><button class="btn alt sm" data-a="restock">Restock</button><button class="btn alt sm" data-a="adjust">Adjust</button><button class="btn gold sm" data-a="newStock">+ Item</button></div>
  <div class="bar"><input id="stq" placeholder="Search stock" value="${esc(ui.stq || "")}"></div>
  ${need.length ? `<div class="card"><h2>Reorder now <span class="neg">${need.length}</span></h2>${need.map((i) => `<div class="row tap" data-a="stockItem" data-id="${i.id}"><div class="grow"><div class="t">${esc(i.name)}</div><div class="s">${esc(entName(i.outletId))} · ${fq(i.qty)} left, reorder at ${fq(i.low)}</div></div><div class="amt neg">${num(i.reorderQty) ? "Order " + fq(i.reorderQty) : stockState(i) === "out" ? "Out" : "Low"}</div></div>`).join("")}</div>` : ""}
  ${groups.map(([name, items]) => `<div class="card"><h2>${esc(name)} <span>${money(items.reduce((a, i) => a + Math.max(0, num(i.qty)) * stockCost(i.id), 0))}</span></h2>${items.map(row).join("")}</div>`).join("") || `<div class="card"><div class="empty">${S.stock.length ? "No match." : "No stock yet. Open More > Products, tap a product and choose to count its stock."}</div></div>`}`;
}

export function stockItem(id) {
  const i = byId("stock", id);
  if (!i) return;
  $("#modal").innerHTML =
    `<div class="overlay"><div class="sheet"><h3>${esc(i.name)}<button class="x" data-a="closeModal">×</button></h3><div class="card"><div class="s">${esc(entName(i.outletId))}${i.productId ? " · linked to a product" : ""}</div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr);margin-top:8px">${kpi("On hand", fq(i.qty), stockState(i) !== "ok" ? "neg" : "")}${kpi("Reorder at", fq(i.low))}${kpi("Usual order", num(i.reorderQty) ? fq(i.reorderQty) : "—")}</div>
    <div>${stockBadge(i)}</div><div class="bar" style="margin:12px 0 0"><button class="btn gold" data-a="stockRestock" data-id="${i.id}">Restock</button><button class="btn alt" data-a="stockAdjust" data-id="${i.id}">Adjust</button><button class="btn alt" data-a="stockEdit" data-id="${i.id}">Edit / count</button></div></div></div></div>`;
}
