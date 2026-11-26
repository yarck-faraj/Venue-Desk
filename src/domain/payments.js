/** @param {string} id @param {Array<{bookingId?: string, type?: string, amount?: unknown}>} payments */
export const paidOf = (id, payments) =>
  payments
    .filter((p) => p.bookingId === id)
    .reduce((a, p) => a + (p.type === "refund" ? -(Number(p.amount) || 0) : Number(p.amount) || 0), 0);

/** @param {{legacy?: boolean, legacyKind?: string, legacyName?: string, stayId?: string}} p @param {string | undefined} kind @param {string | undefined} guestName @param {string | undefined} bookingTitle */
export const payTitle = (p, kind, guestName, bookingTitle) =>
  p.legacy
    ? "Old record · " + ([kind, p.legacyName].filter(Boolean).join(" · ") || "paper book")
    : p.stayId
      ? "Stay: " + (guestName || "(deleted)")
      : bookingTitle || "(deleted event)";
