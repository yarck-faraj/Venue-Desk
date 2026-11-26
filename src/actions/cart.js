import { S, ui } from "../state/store.js";
import { stockDelta, stockUse } from "../domain/stock.js";
import { byId, cartSub, cartTotal, nextReceiptNo } from "../state/selectors.js";
import { num } from "../domain/money.js";
import { toast } from "../components/toast.js";
import { myShift } from "../state/shift.js";
import { myEmail, myOutlet, role } from "../state/session.js";
import { today } from "../domain/dates.js";
import { writeSale } from "../firebase/writes.js";
import { cashChange } from "../domain/pos.js";
import { render } from "../app/render.js";
import { showReceipt } from "./receipts.js";
import { PR } from "../state/persist.js";
import { thermalPrint } from "../hardware/printer.js";

import { saveCart, withCurrentCart } from "../app/cart-draft.js";

export function checkout(method, tendered, displayed = ui.pos.cart) {
  return withCurrentCart(async () => {
    if (displayed !== ui.pos.cart) return toast("Review the current sale before taking payment.");
    const P = ui.pos;
    if (!P.cart.length) return;
    {
      const need = stockUse(P.cart); // last line of defence: never sell what is not on the shelf
      for (const [sid, u] of Object.entries(need)) {
        const st = byId("stock", sid);
        if (st && num(st.qty) - u < -1e-9)
          return toast(
            "Not enough " + st.name + " in stock (" + num(st.qty) + " left). Reduce it on the sale.",
          );
      }
    }
    const sh = myShift(),
      items = P.cart.map((i) => ({ ...i })),
      oid = role() === "cashier" ? myOutlet() : items[0]?.outletId || "";
    const draft = {
      no: nextReceiptNo(oid, today()),
      items,
      subtotal: cartSub(),
      discount: 0,
      total: cartTotal(),
      method,
      status: "paid",
      shiftId: sh ? sh.id : "",
      staff: myEmail(),
      date: today(),
      ts: Date.now(),
      tendered: num(tendered),
      payShiftId: sh ? sh.id : "",
      paidDate: today(),
      paidAt: Date.now(),
    };
    // Retire the draft before submitting so a storage failure cannot leave a
    // payable copy of a sale we have already sent to Firestore.
    if (!(await saveCart([]))) return;
    let id;
    try {
      id = writeSale(null, draft, stockDelta(items, []));
    } catch (error) {
      await saveCart(displayed);
      render();
      toast("Could not submit sale: " + error.message);
      return;
    }
    const sale = Object.assign(draft, { id, outletId: oid });
    const change = cashChange(method, tendered, sale.total);
    {
      const k = S.sales.findIndex((x) => x.id === sale.id);
      if (k >= 0) S.sales[k] = { ...S.sales[k], ...sale };
      else S.sales.push({ ...sale });
    }
    render();
    showReceipt(sale, change);
    if (role() === "cashier" && PR.auto()) thermalPrint(sale, change, { kick: method === "cash" });
  });
}
