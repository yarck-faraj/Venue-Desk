import { byId, cartTotal, cur, liveStay, money, roomNames } from "../state/selectors.js";
import { isOwner } from "../state/session.js";
import { S } from "../state/store.js";
import { live } from "../domain/bookings.js";
import { fmtDay, today } from "../domain/dates.js";
import { form } from "../components/form.js";
import { audit } from "../firebase/audit.js";
import { del, save } from "../firebase/writes.js";
import { myShift } from "../state/shift.js";

export function editPayment(id, bookingId, stayId) {
  const p = id ? byId("payments", id) : null;
  const bks = S.bookings
    .filter(live)
    .sort((a, b) => b.start.localeCompare(a.start))
    .map((b) => ["b:" + b.id, "Event: " + b.title + " · " + fmtDay(b.start)]);
  const sts = S.stays
    .filter(liveStay)
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    .map((s) => [
      "s:" + s.id,
      "Stay: " + s.guestName + " · Room " + roomNames(s) + " · " + fmtDay(s.checkIn),
    ]);
  const tgt = p
    ? p.stayId
      ? "s:" + p.stayId
      : p.bookingId
        ? "b:" + p.bookingId
        : ""
    : stayId
      ? "s:" + stayId
      : bookingId
        ? "b:" + bookingId
        : "";
  form(
    p ? "Edit payment" : "Record payment",
    [
      { k: "target", label: "For", type: "select", req: true, opts: [["", "— choose —"], ...bks, ...sts] },
      {
        k: "type",
        label: "Type",
        type: "select",
        opts: [
          ["deposit", "Deposit"],
          ["payment", "Payment"],
          ["refund", "Refund"],
        ],
      },
      { k: "amount", label: `Amount (${cur()})`, type: "number", step: "0.01", req: true },
      { k: "date", label: "Date", type: "date" },
      {
        k: "method",
        label: "Method",
        type: "select",
        opts: [
          ["cash", "Cash"],
          ["momo", "Mobile money"],
          ["bank", "Bank transfer"],
          ["card", "Card"],
          ["cheque", "Cheque"],
        ],
      },
      { k: "note", label: "Reference / note" },
    ],
    p ? { ...p, target: tgt } : { target: tgt, type: "deposit", date: today(), method: "momo" },
    {
      onSave(o) {
        const { target, ...rest } = o;
        if (o.type === "refund") audit("refund", money(o.amount) + " · " + target);
        save("payments", id, {
          ...(id ? {} : { shiftId: (myShift() || {}).id || "" }),
          ...rest,
          bookingId: target.startsWith("b:") ? target.slice(2) : "",
          stayId: target.startsWith("s:") ? target.slice(2) : "",
        });
      },
      onDelete: p && isOwner() ? () => del("payments", id) : null,
    },
  );
}

export function cashPayment(checkout) {
  return form(
    "Cash payment",
    [
      {
        k: "tendered",
        label: "Amount received (total " + money(cartTotal()) + ")",
        type: "number",
        step: "0.01",
      },
    ],
    { tendered: cartTotal() },
    { onSave: (o) => checkout("cash", o.tendered || cartTotal()) },
  );
}
