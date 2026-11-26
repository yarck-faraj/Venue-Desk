import { byId, cur, stockCost, stockLabel } from "../state/selectors.js";
import { S } from "../state/store.js";
import { form } from "../components/form.js";
import { parseSizes } from "../domain/parse.js";
import { num } from "../domain/money.js";
import { del, saveProduct } from "../firebase/writes.js";

export function editProduct(id) {
  const p = id ? byId("products", id) : null,
    ownSt = id ? S.stock.find((x) => x.productId === id) || null : null,
    linked = p && p.stockId ? byId("stock", p.stockId) : null;
  const tracked = !!(ownSt && linked && linked.id === ownSt.id),
    shared = !!(linked && !tracked),
    advanced = shared || S.stock.some((i) => !i.productId);
  const vals = p
    ? {
        ...p,
        sizesText: (p.variations || [])
          .map((v) => v.size + ", " + v.price + (v.volume ? ", " + v.volume : ""))
          .join("\n"),
        track: tracked ? "1" : "",
        ...(ownSt
          ? {
              stockQty: ownSt.qty,
              reorderLevel: ownSt.low,
              reorderQty: ownSt.reorderQty,
              stockCost: stockCost(ownSt.id),
            }
          : {}),
      }
    : null;
  form(
    p ? "Edit product" : "New product",
    [
      { k: "name", label: "Name", req: true },
      {
        k: "outletId",
        label: "Sold at",
        type: "select",
        req: true,
        opts: [["", "— choose —"], ...S.outlets.map((o) => [o.id, o.name])],
      },
      { k: "category", label: "Category", ph: "Drinks, Meals, Snacks, Juices…" },
      {
        k: "price",
        label: `Price (${cur()}). Leave empty if the item has sizes`,
        type: "number",
        step: "0.01",
      },
      {
        k: "sizesText",
        label: "Sizes, one per line: name, price (e.g. Small, 30)",
        type: "textarea",
        rows: 3,
        ph: "Small, 30\nMedium, 40\nLarge, 50",
      },
      { k: "barcode", label: "Barcode (scan or type, optional)" },
      ...(shared
        ? []
        : [
            {
              k: "track",
              label:
                "Count stock for this item? (bottles, packs…). When it reaches zero the till stops selling it",
              type: "select",
              opts: [
                ["", "No"],
                ["1", "Yes, count it"],
              ],
            },
            {
              k: "stockQty",
              label: "Stock on hand now (units). Changing it records a correction",
              type: "number",
              step: "0.01",
            },
            {
              k: "reorderLevel",
              label: "Reorder level: warn when stock is at or below this",
              type: "number",
              step: "0.01",
            },
            { k: "reorderQty", label: "Usual quantity to reorder (optional)", type: "number", step: "0.01" },
            { k: "stockCost", label: `Cost per unit (${cur()}, optional)`, type: "number", step: "0.01" },
          ]),
      ...(advanced
        ? [
            {
              k: "stockId",
              label: shared
                ? "Takes stock from (shared stock item)"
                : "Or take stock from an existing stock item (advanced, ignored if you count this item above)",
              type: "select",
              opts: [
                ["", "— none —"],
                ...S.stock
                  .filter((i) => !i.productId || (p && i.productId === id))
                  .map((i) => [i.id, stockLabel(i)]),
              ],
            },
            {
              k: "perSale",
              label: "Stock used per sale (shared item only)",
              type: "number",
              step: "0.01",
              def: 1,
            },
          ]
        : []),
    ],
    vals,
    {
      validate(o) {
        const v = parseSizes(o.sizesText);
        if (o.sizesText && !v.length) return "Sizes go one per line, like: Small, 30";
        if (!v.length && !num(o.price)) return "Enter a price, or add at least one size.";
        return "";
      },
      onSave(o) {
        const v = parseSizes(o.sizesText);
        o.variations = v;
        if (v.length) o.price = Math.min(...v.map((x) => x.price));
        const trk = o.track === "1",
          q = num(o.stockQty),
          lvl = num(o.reorderLevel),
          rq = num(o.reorderQty),
          cost = num(o.stockCost);
        ["sizesText", "track", "stockQty", "reorderLevel", "reorderQty", "stockCost"].forEach(
          (k) => delete o[k],
        );
        saveProduct(id, o, ownSt, { trk, q, lvl, rq, cost });
      },
      onDelete: p ? () => del("products", id) : null,
    },
  );
}
