import { S } from "../../state/store.js";
import { esc } from "../../utils/dom.js";
import { byId, money } from "../../state/selectors.js";
import { stockState } from "../../domain/stock.js";
import { fq, num } from "../../domain/money.js";

export function vProducts() {
  return (
    `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button><span class="grow"></span><button class="btn alt sm" data-a="importMenu">Import menu file</button> <button class="btn gold sm" data-a="newProduct">+ Product</button></div>` +
    (S.outlets
      .map((o) => {
        const l = S.products
          .filter((p) => p.outletId === o.id)
          .sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));
        return `<div class="card"><h2>${esc(o.name)}</h2>${
          l
            .map((p) => {
              const st = byId("stock", p.stockId),
                own = st && st.productId === p.id;
              return `<div class="row tap" data-a="editProduct" data-id="${p.id}"><div class="grow"><div class="t">${esc(p.name)}</div><div class="s">${esc(p.category || "")}${own ? ` · <span class="${stockState(st) !== "ok" ? "neg" : ""}">${fq(st.qty)} in stock${stockState(st) === "out" ? " (out)" : stockState(st) === "low" ? " (reorder)" : ""}</span>` : st ? " · uses " + (num(p.perSale) || 1) + " " + esc(st.unit || "") + " " + esc(st.name) : ""}</div></div><div class="amt">${money(p.price)}</div></div>`;
            })
            .join("") || '<div class="empty">No products.</div>'
        }</div>`;
      })
      .join("") || '<div class="card empty">Add outlets first.</div>')
  );
}
