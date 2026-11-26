/** @param {{staff?: string, tendered?: unknown, total: number}} sale @param {{name?: string} | undefined} outlet @param {Record<string, string>} names @param {string} tag @param {number} [change] */
export const receiptData = (sale, outlet, names, tag, change) => ({
  name: (outlet?.name || "Lynn's Event Center").replace(/^Lynn's\s*/i, "") || "Lynn's",
  who: names[(sale.staff || "").toLowerCase()] || (sale.staff || "").split("@")[0],
  tag,
  change: change || Math.max(0, (Number(sale.tendered) || 0) - (Number(sale.total) || 0)),
});

/** @param {Record<string, any>} s @param {number} change @param {{kick?: boolean, ruler?: boolean}} o @param {{cols: number, money: (amount: number) => string, who: string, name: string, tag: string, address: string, phones: string, methods: Record<string,string>, timestamp: string}} settings */
export function escReceipt(s, change, o, settings) {
  const { cols: C, money, who, name: nm, tag, address, phones, methods, timestamp } = settings;
  /** @type {number[]} */
  const b = [];
  /** @param {number} n */
  const pm = (n) => money(n).replace("₵", "¢"); // WPC1252 has the cent sign, not the cedi sign
  /** @param {...number} a */
  const raw = (...a) => {
    a.forEach((x) => b.push(x));
  };
  /** @param {unknown} t */
  const txt = (t) => {
    for (const ch of String(t)) {
      const c = ch.charCodeAt(0);
      b.push(c < 256 ? c : c === 0x2014 ? 0x97 : c === 0x2019 ? 0x92 : 0x3f);
    }
  };
  /** @param {unknown} t */
  const ln = (t) => {
    txt(t);
    raw(0x0a);
  };
  const rule = () => ln("-".repeat(C));
  /** @param {string} l @param {string} r @param {number} [w] */
  const lr = (l, r, w = C) =>
    String(l)
      .slice(0, Math.max(1, w - String(r).length - 1))
      .padEnd(w - String(r).length) + r;
  if (o.kick) raw(0x1b, 0x70, 0, 25, 250); // open the cash drawer
  raw(0x1b, 0x40, 0x1b, 0x74, 16, 0x1b, 0x61, 1); // reset, WPC1252, centre
  if (o.ruler) {
    ln("1234567890".repeat(6));
    ln("");
  }
  ln("LYNN'S");
  raw(0x1b, 0x45, 1, 0x1d, 0x21, 0x11);
  ln(nm.toUpperCase());
  raw(0x1d, 0x21, 0, 0x1b, 0x45, 0);
  ln("Lynn's Event Center");
  ln(address);
  ln(phones);
  if (tag) ln(tag);
  raw(0x1b, 0x61, 0);
  rule();
  ln(lr("Receipt #" + s.no, timestamp));
  ln("Served by " + who);
  rule();
  s.items.forEach((/** @type {{qty: number, price: number, name: string}} */ i) => {
    const amt = pm(i.qty * i.price),
      name = i.qty + " x " + i.name,
      w = C - amt.length - 1;
    ln(lr(name.slice(0, w), amt));
    for (let k = w; k < name.length; k += C - 2) ln("  " + name.slice(k, k + C - 2));
  });
  rule();
  if (s.discount) ln(lr("Discount", "-" + pm(s.discount)));
  raw(0x1b, 0x45, 1, 0x1d, 0x21, 0x11);
  ln(lr("TOTAL", pm(s.total), Math.floor(C / 2)));
  raw(0x1d, 0x21, 0, 0x1b, 0x45, 0);
  if (s.status === "paid") ln("Paid by " + (methods[s.method] || s.method));
  if (s.method === "cash" && (Number(s.tendered) || 0) > 0) {
    ln(lr("Cash received", pm(s.tendered)));
    ln(lr("Change", pm(change || Math.max(0, (Number(s.tendered) || 0) - (Number(s.total) || 0)))));
  }
  rule();
  raw(0x1b, 0x61, 1);
  ln("Thank you for choosing Lynn's!");
  ln("@lynnseventcenter");
  raw(0x1b, 0x64, 4, 0x1d, 0x56, 1); // feed, partial cut
  return b;
}
