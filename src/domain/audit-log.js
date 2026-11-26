/** @param {{range: string, from?: string, to?: string}} al @param {string} today @param {() => number} [now] */
export function auditRange(al, today, now = Date.now) {
  /** @param {string} k */
  const d0 = (k) => new Date(k + "T00:00:00").getTime();
  if (al.range === "custom") return [al.from ? d0(al.from) : 0, al.to ? d0(al.to) + 864e5 - 1 : now() + 1];
  if (al.range === "today") return [d0(today), now() + 1];
  return [now() - (Number(al.range) || 0) * 864e5, now() + 1];
}

/** @param {{q: string, staff?: string, action?: string}} al @param {Array<{by?: string, action: string, detail?: string, ts?:number}>} rows */
export function auditFiltered(al, rows) {
  const q = al.q.toLowerCase();
  return rows.filter(
    (a) =>
      (!al.staff || a.by === al.staff) &&
      (!al.action || a.action === al.action) &&
      (!q || (a.action + " " + (a.detail || "") + " " + (a.by || "")).toLowerCase().includes(q)),
  );
}
