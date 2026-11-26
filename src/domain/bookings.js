/** @param {{status?: string}} b */
export const live = (b) => b.status !== "cancelled";

/** @param {{id?: string, status?: string, start: string, end: string, spaceIds?: string[]}} b @param {string} day */
export const onDay = (b, day) => live(b) && b.start.slice(0, 10) <= day && b.end.slice(0, 10) >= day;

/** @param {{id?: string, status?: string, start: string, end: string, spaceIds?: string[]}} b @template {{id?: string, status?: string, start: string, end: string, spaceIds?: string[]}} T @param {T[]} bookings */
export function conflicts(b, bookings) {
  return bookings.filter(
    (o) =>
      o.id !== b.id &&
      live(o) &&
      (o.spaceIds || []).some((s) => (b.spaceIds || []).includes(s)) &&
      o.start < b.end &&
      b.start < o.end,
  );
}

/** @param {string} id @param {Array<{bookingId?: string, method?: string, status?: string, total?: unknown}>} sales */
export const chargesOf = (id, sales) =>
  sales
    .filter((s) => s.bookingId === id && s.method === "booking" && s.status === "paid")
    .reduce((a, s) => a + (Number(s.total) || 0), 0);

/** @param {{id: string}} b @param {Array<{bookingId?: string, amount?: unknown}>} expenses @param {number} crewCost */
export const costOf = (b, expenses, crewCost) =>
  expenses.filter((e) => e.bookingId === b.id).reduce((a, e) => a + (Number(e.amount) || 0), 0) + crewCost;

/** @param {{price?: unknown}} b @param {number} charges @param {number} paid */
export const balanceOf = (b, charges, paid) => (Number(b.price) || 0) + charges - paid;
