/** @param {{name?: string, role?: string}} c */
export const crewKey = (c) =>
  (String(c.name || "").trim() + "|" + String(c.role || "").trim())
    .toLowerCase()
    .replace(/[\/.#$\[\]]/g, " ");

/** @param {Record<string, unknown>} pay @param {{name?: string, role?: string}} c */
export const crewPayOf = (pay, c) => Number(pay[crewKey(c)]) || 0; // pay is kept in crewPay/{bookingId}, which only the owner can read

/** @param {{crew?: Array<{name?: string, role?: string}>}} b @param {Record<string, unknown>} pay */
export const crewTotal = (b, pay) => (b.crew || []).reduce((a, c) => a + crewPayOf(pay, c), 0);

/** @param {{crew?: Array<{name?: string, role?: string}>}} b @param {boolean} owner @param {Record<string, unknown>} pay */
export const crewText = (b, owner, pay) =>
  (b.crew || [])
    .map((c) => (owner ? [c.name, c.role, crewPayOf(pay, c) || ""].join(", ") : [c.name, c.role].join(", ")))
    .join("\n");
