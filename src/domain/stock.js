/** @param {Array<{stockId?: string, qty: number, per?: number}> | null} items */
export function stockUse(items) {
  /** @type {Record<string, number>} */
  const m = {};
  (items || []).forEach((i) => {
    if (i.stockId) m[i.stockId] = (m[i.stockId] || 0) + i.qty * (i.per || 1);
  });
  return m;
}

/** @param {Parameters<typeof stockUse>[0]} nw @param {Parameters<typeof stockUse>[0]} old */
export function stockDelta(nw, old) {
  const a = stockUse(nw),
    b = stockUse(old);
  /** @type {Record<string, number>} */
  const o = {};
  new Set([...Object.keys(a), ...Object.keys(b)]).forEach((k) => {
    const d = (a[k] || 0) - (b[k] || 0);
    if (d) o[k] = d;
  });
  return o;
}

/** @param {{qty?: unknown, low?: unknown}} i */
export const stockState = (i) =>
  (Number(i.qty) || 0) <= 0 ? "out" : (Number(i.qty) || 0) <= (Number(i.low) || 0) ? "low" : "ok"; // out of stock / at or below the reorder level / fine

/** @param {{name: string}[]} categories @param {{category: string}[]} expenses @param {string[]} defaults */
export const expCats = (categories, expenses, defaults) =>
  [
    ...new Set(
      [...(categories || []).map((c) => c.name), ...expenses.map((e) => e.category), ...defaults].filter(
        Boolean,
      ),
    ),
  ].sort((a, b) => a.localeCompare(b));

/** @template T @param {string} t @param {T[]} items @param {(item: T) => string} label */
export const stockByLabel = (t, items, label) =>
  items.find(
    (i) =>
      label(i).toLowerCase() ===
      String(t || "")
        .trim()
        .toLowerCase(),
  );
