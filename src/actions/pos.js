import { ui } from "../state/store.js";
import { saveLocal, writeSale } from "../firebase/writes.js";
import { myEmail, myOutlet } from "../state/session.js";
import { today } from "../domain/dates.js";
import { render } from "../app/render.js";
import { scanClose, scanOpen } from "../hardware/scanner.js";
import { addCartItem } from "./cart-item.js";
import { byId, money } from "../state/selectors.js";
import { num } from "../domain/money.js";
import { stockDelta, stockUse } from "../domain/stock.js";
import { toast } from "../components/toast.js";
import { checkout } from "./cart.js";
import { saveCart, withCurrentCart } from "../app/cart-draft.js";
import { cashPayment } from "../editors/payment.js";
import { showReceipt } from "./receipts.js";
import { audit } from "../firebase/audit.js";
import { closeModal } from "../components/modal.js";
import { closeShift, openShift } from "../editors/shift.js";

export const posActions = {
  startDay: () => {
    if (ui.starting) return;
    ui.starting = true;
    saveLocal("shifts", null, {
      staff: myEmail(),
      openedAt: Date.now(),
      date: today(),
      outletId: myOutlet(),
      float: 0,
      closedAt: 0,
    });
    setTimeout(() => {
      ui.starting = false;
      render();
    }, 4000);
  },
  scanOpen: () => scanOpen(),
  scanClose: () => scanClose(),
  cxSizes: (d) => {
    ui.cxPick = d.id;
    render();
  },
  cxCloseSizes: () => {
    ui.cxPick = "";
    render();
  },
  cxAdd: addCartItem,
  inc: (d) =>
    withCurrentCart(async () => {
      const c = ui.pos.cart,
        i = +d.i,
        it = c[i];
      if (!it) return;
      const st = it.stockId && byId("stock", it.stockId);
      if (st && num(st.qty) - (stockUse(c)[st.id] || 0) < (it.per || 1) - 1e-9)
        return toast("No more " + it.name + " in stock");
      const next = c.slice();
      next[i] = { ...it, qty: it.qty + 1 };
      if (await saveCart(next)) render();
    }),
  dec: (d) =>
    withCurrentCart(async () => {
      const next = ui.pos.cart.slice(),
        i = +d.i,
        it = next[i];
      if (!it) return;
      if (it.qty === 1) next.splice(i, 1);
      else next[i] = { ...it, qty: it.qty - 1 };
      if (await saveCart(next)) render();
    }),
  clearCart: () =>
    withCurrentCart(async () => {
      if (await saveCart([])) render();
    }),
  payCash: () => {
    const displayed = ui.pos.cart;
    cashPayment((method, tendered) => checkout(method, tendered, displayed));
  },
  pay: (d) => checkout(d.k),
  openSale: (d) => showReceipt(byId("sales", d.id), 0),
  voidSale: () => {
    const s = ui.rc.s,
      why = prompt("Reason for voiding this sale?");
    if (!why) return;
    writeSale(
      s.id,
      { status: "void", voidReason: why, voidBy: myEmail(), voidAt: Date.now() },
      stockDelta([], s.items),
    );
    audit("void", "Receipt " + s.no + " " + money(s.total) + " · " + why);
    closeModal();
    toast("Sale voided, stock restored");
  },
  openShift: () => openShift(),
  closeShift: () => closeShift(),
};
