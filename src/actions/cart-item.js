import { saveCart, withCurrentCart } from "../app/cart-draft.js";
import { byId } from "../state/selectors.js";
import { ui } from "../state/store.js";
import { num } from "../domain/money.js";
import { stockUse } from "../domain/stock.js";
import { toast } from "../components/toast.js";
import { render } from "../app/render.js";

/* ---------- events ---------- */
export const addCartItem = (d) =>
  withCurrentCart(async () => {
    const p = byId("products", d.id);
    if (!p || p.outletId !== ui.pos.outlet) return false;
    const v = d.v ? (p.variations || []).find((x) => x.size === d.v) : null,
      pid = p.id + (v ? "|" + v.size : ""),
      c = ui.pos.cart.map((line) => ({ ...line })),
      ex = c.find((i) => i.pid === pid),
      per = num(p.perSale) || 1,
      st = p.stockId && byId("stock", p.stockId);
    if (st) {
      const left = num(st.qty) - (stockUse(c)[st.id] || 0);
      if (left < per - 1e-9) {
        toast(
          num(st.qty) <= 0
            ? p.name + " is out of stock"
            : p.name + ": only " + Math.floor(num(st.qty) / per + 1e-9) + " in stock",
        );
        ui.cxPick = "";
        render();
        return false;
      }
    }
    if (ex) ex.qty++;
    else
      c.push({
        pid,
        name: p.name + (v ? " · " + v.size : ""),
        price: num(v ? v.price : p.price),
        qty: 1,
        stockId: p.stockId || "",
        per,
        outletId: p.outletId,
      });
    if (!(await saveCart(c))) return null;
    ui.cxPick = "";
    render();
    return true;
  });
