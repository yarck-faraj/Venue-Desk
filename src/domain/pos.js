/** @param {Array<{price: number, qty: number}>} cart */
export const cartSub = (cart) => cart.reduce((a, i) => a + i.price * i.qty, 0);

/** @param {{paidDate?: string, date: string}} s */
export const saleDate = (s) => s.paidDate || s.date;

/** @param {string} oid @param {string} date @param {Record<string, string>} codes @param {Array<{outletId?: string, no?: string}>} sales */
export function nextReceiptNo(oid, date, codes, sales) {
  // GB-261104-007: bar, date (YYMMDD), then 001, 002... counted from today's receipts of that bar
  const code =
      codes[oid] ||
      String(oid || "XX")
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 2)
        .toUpperCase()
        .padEnd(2, "X"),
    pre = code + "-" + date.slice(2, 4) + date.slice(5, 7) + date.slice(8, 10) + "-";
  let m = 0;
  sales.forEach((x) => {
    if (x.outletId === oid && typeof x.no === "string" && x.no.startsWith(pre))
      m = Math.max(m, parseInt(x.no.slice(pre.length), 10) || 0);
  });
  return pre + String(m + 1).padStart(3, "0");
}

/** @param {{id: string, float?: number}} sh @param {Array<{payShiftId?: string, status: string, method: string, total: number}>} sales @param {Array<{shiftId?: string, method: string, type: string, amount: number}>} payments */
export function shiftStats(sh, sales, payments) {
  const paid = sales.filter((s) => s.payShiftId === sh.id && s.status === "paid");
  /** @type {Record<string, number>} */ const by = {};
  paid.forEach((s) => (by[s.method] = (by[s.method] || 0) + (Number(s.total) || 0)));
  payments
    .filter((p) => p.shiftId === sh.id)
    .forEach(
      (p) => (by[p.method] = (by[p.method] || 0) + (p.type === "refund" ? -1 : 1) * (Number(p.amount) || 0)),
    );
  return { n: paid.length, by, expected: (Number(sh.float) || 0) + (by.cash || 0) };
}

/** @param {string} method @param {unknown} tendered @param {number} total */
export const cashChange = (method, tendered, total) =>
  method === "cash" ? Math.max(0, (Number(tendered) || 0) - total) : 0;
