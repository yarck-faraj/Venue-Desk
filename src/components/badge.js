import { stockState } from "../domain/stock.js";

export const stockBadge = (i) => {
  const k = stockState(i);
  return k === "out"
    ? '<span class="badge b-cancelled">Out of stock</span>'
    : k === "low"
      ? '<span class="badge b-hold">Reorder</span>'
      : '<span class="badge b-confirmed">OK</span>';
};

export const stayBadge = (s) =>
  `<span class="badge ${{ reserved: "b-hold", checkedin: "b-confirmed", checkedout: "b-completed", cancelled: "b-cancelled", noshow: "b-cancelled" }[s.status]}">${{ reserved: "reserved", checkedin: "in-house", checkedout: "checked out", cancelled: "cancelled", noshow: "no-show" }[s.status]}</span>`;
