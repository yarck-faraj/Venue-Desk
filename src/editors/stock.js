import { byId, cur, stockByLabel, stockCost, stockLabel } from "../state/selectors.js";
import { form } from "../components/form.js";
import { S } from "../state/store.js";
import { fq, num } from "../domain/money.js";
import { del, save, stockMove } from "../firebase/writes.js";
import { audit } from "../firebase/audit.js";
import { toast } from "../components/toast.js";

export function editStock(id) {
  const i = id ? byId("stock", id) : null;
  form(
    i ? "Edit stock item" : "New stock item",
    [
      {
        k: "outletId",
        label: "Outlet",
        type: "select",
        req: true,
        opts: [["", "— choose —"], ...S.outlets.map((o) => [o.id, o.name])],
      },
      { k: "name", label: "Name", req: true, ph: "Coke 50cl, Rice, Oranges…" },
      { k: "unit", label: "Unit", ph: "bottle, kg, litre, pack" },
      {
        k: "qty",
        label: i
          ? "Stock on hand (type the counted number; a change is recorded as a correction)"
          : "Quantity now",
        type: "number",
        step: "0.01",
      },
      { k: "low", label: "Reorder level: warn when stock is at or below this", type: "number", step: "0.01" },
      { k: "reorderQty", label: "Usual quantity to reorder (optional)", type: "number", step: "0.01" },
      { k: "cost", label: `Cost per unit (${cur()})`, type: "number", step: "0.01" },
    ],
    i ? { ...i, cost: stockCost(i.id) } : null,
    {
      onSave(o) {
        const cost = num(o.cost);
        delete o.cost;
        let sid = id;
        if (i) {
          const d = num(o.qty) - num(i.qty);
          delete o.qty;
          save("stock", id, o);
          if (Math.abs(d) > 1e-9) {
            stockMove(id, d, "count", { note: "Counted: " + fq(i.qty) + " to " + fq(num(i.qty) + d) });
            audit("stock count", i.name + ": " + fq(i.qty) + " to " + fq(num(i.qty) + d));
          }
        } else sid = save("stock", id, o);
        save("stockCosts", sid, { cost, outletId: o.outletId });
      },
      onDelete: i ? () => del("stock", id) : null,
    },
  );
}

export function restock(itemId) {
  const it = itemId ? byId("stock", itemId) : null;
  form(
    it ? "Restock: " + it.name : "Restock",
    [
      ...(it
        ? [{ k: "info", type: "info", label: "Now in stock", text: fq(it.qty) + " " + (it.unit || "") }]
        : [
            {
              k: "item",
              label: "Item (start typing to search)",
              type: "combo",
              req: true,
              ph: "e.g. Coke",
              opts: S.stock.map(stockLabel),
            },
          ]),
      { k: "qty", label: "Quantity received", type: "number", step: "0.01", req: true },
      { k: "total", label: `Total paid (${cur()})`, type: "number", step: "0.01" },
      {
        k: "exp",
        label: "Record as an expense?",
        type: "select",
        opts: [
          ["yes", "Yes"],
          ["no", "No (already recorded / on credit)"],
        ],
      },
      { k: "note", label: "Supplier / note" },
    ],
    { exp: "yes" },
    {
      validate(o) {
        return it || stockByLabel(o.item) ? "" : "Pick the item from the list as it is written there.";
      },
      onSave(o) {
        const t = it || stockByLabel(o.item),
          q = num(o.qty);
        stockMove(t.id, q, "restock", {
          total: num(o.total),
          cost: q && num(o.total) ? num(o.total) / q : 0,
          expense: o.exp === "yes" && num(o.total) > 0,
          note: o.note,
        });
        toast("Restocked " + t.name + ": +" + fq(q));
      },
    },
  );
}

export function adjust(itemId) {
  const it = itemId ? byId("stock", itemId) : null;
  form(
    it ? "Adjust: " + it.name : "Adjust stock",
    [
      ...(it
        ? [{ k: "info", type: "info", label: "Now in stock", text: fq(it.qty) + " " + (it.unit || "") }]
        : [
            {
              k: "item",
              label: "Item (start typing to search)",
              type: "combo",
              req: true,
              ph: "e.g. Coke",
              opts: S.stock.map(stockLabel),
            },
          ]),
      { k: "qty", label: "Change (use minus to remove)", type: "number", step: "0.01", req: true, neg: true },
      {
        k: "note",
        label: "Reason",
        type: "select",
        opts: [
          ["Wastage", "Wastage / spoilage"],
          ["Stock count correction", "Stock count correction"],
          ["Staff meal", "Staff meal"],
          ["Breakage", "Breakage"],
          ["Other", "Other"],
        ],
      },
    ],
    {},
    {
      validate(o) {
        return it || stockByLabel(o.item) ? "" : "Pick the item from the list as it is written there.";
      },
      onSave(o) {
        const t = it || stockByLabel(o.item);
        stockMove(t.id, num(o.qty), "adjust", { note: o.note });
        audit("stock adjust", t.name + " " + o.qty + " (" + o.note + ")");
      },
    },
  );
}
