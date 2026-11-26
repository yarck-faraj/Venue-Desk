import { me, myOutlet, role } from "../state/session.js";
import { S } from "../state/store.js";
import { render } from "../app/render.js";
import { FV, fs } from "./sdk.js";
import { toast } from "../components/toast.js";
import { byId } from "../state/selectors.js";
import { today } from "../domain/dates.js";
import { fq, num } from "../domain/money.js";
import { audit } from "./audit.js";

/* the bill being rung up survives a power cut or refresh */
export function saveLocal(coll, id, data) {
  // save, and show the result immediately
  const rid = save(coll, id, data),
    doc = { ...data, id: rid, updatedAt: Date.now(), updatedBy: me.email },
    i = S[coll].findIndex((x) => x.id === rid);
  if (i >= 0) S[coll][i] = { ...S[coll][i], ...doc };
  else S[coll].push(doc);
  render();
  return rid;
}

export function save(coll, id, data) {
  const ref = id ? fs.collection(coll).doc(id) : fs.collection(coll).doc();
  ref
    .set({ ...data, updatedAt: Date.now(), updatedBy: me.email }, { merge: true })
    .catch((e) => toast("Could not save: " + e.message));
  return ref.id; // not awaited, so it also works offline
}

export function del(coll, id) {
  fs.collection(coll)
    .doc(id)
    .delete()
    .catch((e) => toast("Could not delete: " + e.message));
}

export function writeSale(id, data, delta) {
  const b = fs.batch(),
    ref = id ? fs.collection("sales").doc(id) : fs.collection("sales").doc(),
    now = Date.now();
  const oid =
    role() === "cashier" ? myOutlet() : data.outletId || ((data.items || [])[0] || {}).outletId || "";
  b.set(
    ref,
    { ...data, ...(oid ? { outletId: oid } : {}), updatedAt: now, updatedBy: me.email },
    { merge: true },
  );
  Object.entries(delta || {}).forEach(([sid, d]) => {
    if (byId("stock", sid))
      b.update(fs.collection("stock").doc(sid), {
        qty: FV().increment(-d),
        updatedAt: now,
        updatedBy: me.email,
      });
  });
  b.commit().catch((e) =>
    toast(
      e && e.code === "permission-denied" && role() === "cashier"
        ? "Could not save sale. Check that this tablet's date and time are correct (set to automatic), then ring it up again."
        : "Could not save sale: " + e.message,
    ),
  );
  return ref.id;
}

export function stockMove(itemId, qty, type, extra = {}) {
  const b = fs.batch(),
    now = Date.now(),
    it = byId("stock", itemId);
  b.update(fs.collection("stock").doc(itemId), {
    qty: FV().increment(qty),
    updatedAt: now,
    updatedBy: me.email,
  });
  if (extra.cost)
    b.set(
      fs.collection("stockCosts").doc(itemId),
      { cost: extra.cost, outletId: it.outletId, updatedAt: now, updatedBy: me.email },
      { merge: true },
    );
  b.set(fs.collection("stockMoves").doc(), {
    itemId,
    itemName: it.name,
    qty,
    type,
    date: today(),
    by: me.email,
    note: extra.note || "",
    totalCost: extra.total || 0,
    ts: now,
  });
  if (extra.expense)
    b.set(fs.collection("expenses").doc(), {
      date: today(),
      amount: extra.total,
      category: "Stock purchase",
      note: "Restock: " + it.name,
      vendorId: "",
      bookingId: "",
      entity: it.outletId || "",
      updatedAt: now,
      updatedBy: me.email,
    });
  b.commit().catch((e) => toast("Could not save: " + e.message));
}

/* ====================== ACCOMMODATION ====================== */
/* room pricing: the server (priceStay) writes s.nightly = amount for each night (all rooms together) and s.rate = average per night.
   Stays saved before v17 have no nightly list, so they fall back to nights x rate. */
export function batchWrite(ops) {
  const b = fs.batch(),
    now = Date.now();
  ops.forEach(([coll, id, data]) =>
    b.set(fs.collection(coll).doc(id), { ...data, updatedAt: now, updatedBy: me.email }, { merge: true }),
  );
  b.commit().catch((e) => toast("Could not save: " + e.message));
}

export function saveCrewPay(nid, pay) {
  return fs.collection("crewPay").doc(nid).set({ pay, updatedAt: Date.now(), updatedBy: me.email });
}

export function saveVenue(settings) {
  return fs.doc("settings/venue").set(settings, { merge: true });
}

export function importProducts(items, outlet, title) {
  const b = fs.batch(),
    now = Date.now();
  items.forEach((x) => {
    const v = x.variations || [];
    b.set(fs.collection("products").doc(), {
      name: x.name,
      sku: x.sku || "",
      category: title(x.category),
      outletId: outlet,
      price: v.length ? Math.min(...v.map((z) => z.price)) : num(x.price),
      variations: v,
      barcode: x.barcode || "",
      perSale: 1,
      updatedAt: now,
      updatedBy: me.email,
    });
  });
  return b.commit();
}

export function saveProduct(id, o, ownSt, { trk, q, lvl, rq, cost }) {
  const pid = id || fs.collection("products").doc().id,
    now = Date.now(),
    by = me.email,
    b = fs.batch();
  if (trk) {
    o.perSale = 1;
    const sref = ownSt ? fs.collection("stock").doc(ownSt.id) : fs.collection("stock").doc();
    o.stockId = sref.id;
    if (ownSt) {
      const d = q - num(ownSt.qty),
        upd = { name: o.name, outletId: o.outletId, low: lvl, reorderQty: rq, updatedAt: now, updatedBy: by };
      if (Math.abs(d) > 1e-9) {
        upd.qty = FV().increment(d);
        b.set(fs.collection("stockMoves").doc(), {
          itemId: ownSt.id,
          itemName: o.name,
          qty: d,
          type: "count",
          date: today(),
          by,
          note: "Set from product screen",
          totalCost: 0,
          ts: now,
        });
        audit("stock count", o.name + ": " + fq(ownSt.qty) + " to " + fq(q));
      }
      b.update(sref, upd);
    } else {
      b.set(sref, {
        productId: pid,
        outletId: o.outletId,
        name: o.name,
        unit: "pcs",
        qty: q,
        low: lvl,
        reorderQty: rq,
        updatedAt: now,
        updatedBy: by,
      });
      if (q)
        b.set(fs.collection("stockMoves").doc(), {
          itemId: sref.id,
          itemName: o.name,
          qty: q,
          type: "opening",
          date: today(),
          by,
          note: "Opening stock",
          totalCost: 0,
          ts: now,
        });
    }
    b.set(
      fs.collection("stockCosts").doc(sref.id),
      { cost, outletId: o.outletId, updatedAt: now, updatedBy: by },
      { merge: true },
    );
  } else {
    o.stockId = o.stockId && !(ownSt && o.stockId === ownSt.id) ? o.stockId : "";
    if (!o.perSale) o.perSale = 1;
  } // counting switched off: unlink the product's own stock item
  b.set(fs.collection("products").doc(pid), { ...o, updatedAt: now, updatedBy: by }, { merge: true });
  b.commit().catch((e) => toast("Could not save: " + e.message));
}

export function removeOutlet(id, prods) {
  const b = fs.batch();
  prods.forEach((x) => b.delete(fs.collection("products").doc(x.id)));
  b.delete(fs.collection("outlets").doc(id));
  return b.commit();
}

export function updateStaff(changes) {
  return fs.doc("settings/staff").update(changes);
}

export function saveOldCutoff(ent, d) {
  return fs
    .doc("settings/oldSales")
    .set(
      { cutoff: { [ent]: d || FV().delete() }, updatedAt: Date.now(), updatedBy: me.email },
      { merge: true },
    );
}
