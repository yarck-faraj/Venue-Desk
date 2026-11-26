import { S, ui } from "../../state/store.js";
import { myOutlet } from "../../state/session.js";
import { esc } from "../../utils/dom.js";
import { byId, cartTotal, money } from "../../state/selectors.js";
import { num } from "../../domain/money.js";

/* ---------- cashier app: one bar, one till, nothing else ---------- */
export function cxSell(open, sh) {
  const P = ui.pos;
  if (!sh)
    return `<div class="cxgate"><h2>Good day</h2><p>Start today's till to begin selling.</p><button class="cxbtn" data-a="startDay" ${ui.starting ? "disabled" : ""}>${ui.starting ? "Starting…" : "Start the day"}</button></div>`;
  if (!open)
    return `<div class="cxgate"><h2>Day closed</h2><p>Today's till has been closed. See you tomorrow.</p></div>`;
  const prods = S.products.filter((p) => p.outletId === myOutlet()),
    cats = [...new Set(prods.map((p) => p.category || "Other"))].sort(),
    q = P.q.toLowerCase();
  const list = prods
    .filter(
      (p) =>
        (!P.cat || (p.category || "Other") === P.cat) &&
        (!q || p.name.toLowerCase().includes(q) || (p.barcode || "") === P.q.trim()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const chips =
    cats.length > 1
      ? `<div class="cxchips"><button class="${!P.cat ? "on" : ""}" data-a="posCat" data-k="">All</button>${cats.map((c) => `<button class="${P.cat === c ? "on" : ""}" data-a="posCat" data-k="${esc(c)}">${esc(c)}</button>`).join("")}</div>`
      : "";
  const grid =
    list
      .map((p) => {
        const v = p.variations || [],
          st = byId("stock", p.stockId),
          left = st ? Math.floor(num(st.qty) / (num(p.perSale) || 1)) : null;
        return `<button class="cxprod ${left !== null && left <= 0 ? "out" : ""}" data-a="${v.length ? "cxSizes" : "cxAdd"}" data-id="${p.id}"><b>${esc(p.name)}</b><span>${v.length ? "from " + money(Math.min(...v.map((x) => num(x.price)))) : money(p.price)}</span>${left !== null && left <= num(st.low) ? `<em>${left <= 0 ? "Out" : left + " left"}</em>` : ""}</button>`;
      })
      .join("") || '<div class="cxempty">No products yet. The owner adds them.</div>';
  const cart = P.cart,
    pk = ui.cxPick && byId("products", ui.cxPick);
  const sheet = pk
    ? `<div class="cxsheet" data-a="cxCloseSizes"><div class="cxbox"><h3 style="margin:0">${esc(pk.name)}</h3>${(pk.variations || []).map((v) => `<button class="cxsize" data-a="cxAdd" data-id="${pk.id}" data-v="${esc(v.size)}"><span>${esc(v.size)} <small>${esc(v.volume || "")}</small></span><b>${money(v.price)}</b></button>`).join("")}</div></div>`
    : "";
  return `<div class="cxmain"><div class="cxleft"><div class="cxsearch"><input id="pq" placeholder="Search or scan a barcode" value="${esc(P.q)}"><button class="cxscanbtn" data-a="scanOpen"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M8 9v6M11 9v6M14 9v6M17 9v6"/></svg>Scan</button></div>${chips}<div class="cxgrid">${grid}</div></div>
  <aside class="cxcart"><h3>Current sale${cart.length ? '<button class="cxlink" data-a="clearCart">Clear</button>' : ""}</h3><div class="cxlines">${cart.map((i, n) => `<div class="cxline"><div><b>${esc(i.name)}</b><small>${money(i.price)}</small></div><div class="cxq"><button data-a="dec" data-i="${n}">−</button><b>${i.qty}</b><button data-a="inc" data-i="${n}">+</button></div><b>${money(i.price * i.qty)}</b></div>`).join("") || '<div class="cxempty">Tap an item to start</div>'}</div>
  <div class="cxtotal"><span>Total</span><b>${money(cartTotal())}</b></div>
  <div class="cxpay"><button ${cart.length ? "" : "disabled"} data-a="payCash">Cash</button><button ${cart.length ? "" : "disabled"} data-a="pay" data-k="momo">MoMo</button><button ${cart.length ? "" : "disabled"} data-a="pay" data-k="card">Card</button></div></aside></div>${sheet}`;
}
