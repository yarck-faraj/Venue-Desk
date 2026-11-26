import { S } from "./store.js";
import { myEmail } from "./session.js";

/* ====================== POS, STOCK, SHIFTS, REPORTS ====================== */
export const myShift = () =>
  S.shifts.filter((s) => s.staff === myEmail() && !s.closedAt).sort((a, b) => b.openedAt - a.openedAt)[0];
