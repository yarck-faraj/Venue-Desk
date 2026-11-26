/** @param {string} ent @param {Array<Record<string, any>>} payments @param {Array<{items?: Array<{lump?: boolean, qty?: number, name?: string}>, status?: string, id: string, date?: string, method?: string, total?: number, note?: string, loggedBy?: string, loggedAt?: number}>} sales @param {Record<string, string>} kinds */
export const oldRows = (ent, payments, sales, kinds) =>
  (ent === "center"
    ? payments
        .filter((p) => p.legacy)
        .map((p) => ({
          id: p.id,
          date: p.date || "",
          method: p.method || "",
          desc: [kinds[p.legacyKind], p.legacyName, p.note].filter(Boolean).join(" · "),
          amount: Number(p.amount) || 0,
          by: p.loggedBy || "",
          at: Number(p.loggedAt) || 0,
        }))
    : sales
        .filter((s) => s.status !== "void")
        .map((s) => ({
          id: s.id,
          date: s.date || "",
          method: s.method || "",
          desc:
            (s.items || []).map((i) => (i.lump ? "Day total" : i.qty + " × " + i.name)).join(", ") +
            (s.note ? " · " + s.note : ""),
          amount: Number(s.total) || 0,
          by: s.loggedBy || "",
          at: Number(s.loggedAt) || 0,
        }))
  ).sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at);

/** @param {{date: string, amount: number}[]} rows */
export function oldSum(rows) {
  /** @type {Record<string, number>} */
  const months = {};
  let total = 0;
  rows.forEach((r) => {
    total += r.amount;
    const k = r.date.slice(0, 7);
    months[k] = (months[k] || 0) + r.amount;
  });
  return { n: rows.length, total, months };
}

/** @param {{source: string, cutoff: string, lastDay: string}} st @param {(date: string) => string} format */
export function oldStatus(st, format) {
  const why =
    st.source === "owner"
      ? "The owner set this date."
      : st.source === "first-day"
        ? "That is the first day the app was used for real."
        : "The app has not been used for real sales yet, so today is the start.";
  return `Sales from <b>${format(st.cutoff)}</b> on come from the app. You can log sales for any day <b>before</b> that (the last day you can pick is ${format(st.lastDay)}). ${why}`;
}
