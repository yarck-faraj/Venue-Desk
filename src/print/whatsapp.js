import {
  balanceOf,
  byId,
  money,
  nightsOf,
  roomNames,
  stayBal,
  stayRoomTotal,
  stayTotal,
} from "../state/selectors.js";
import { S, ui } from "../state/store.js";
import { fmtDay, fmtTime } from "../domain/dates.js";

export function whatsapp(id) {
  const b = byId("bookings", id),
    cl = byId("clients", b.clientId);
  if (!cl || !cl.phone) return;
  let ph = cl.phone.replace(/[^\d+]/g, "");
  const dial = (S.venue.dial || "233").replace(/\D/g, "");
  ph = ph.startsWith("+") ? ph.slice(1) : ph.startsWith("0") ? dial + ph.slice(1) : ph;
  const bal = balanceOf(b);
  const msg =
    `Hello ${cl.name}, this is ${S.venue.name || "the venue"}. A reminder about your event "${b.title}" on ${fmtDay(b.start)} at ${fmtTime(b.start)}.` +
    (bal > 0.005 ? ` The outstanding balance is ${money(bal)}.` : " Your payment is complete, thank you.");
  window.open("https://wa.me/" + ph + "?text=" + encodeURIComponent(msg), "_blank");
}

export function stayWhatsapp(id) {
  const s = byId("stays", id);
  if (!s.phone) return;
  let ph = s.phone.replace(/[^\d+]/g, "");
  const dial = (S.venue.dial || "233").replace(/\D/g, "");
  ph = ph.startsWith("+") ? ph.slice(1) : ph.startsWith("0") ? dial + ph.slice(1) : ph;
  const msg =
    s.status === "checkedin"
      ? `Hello ${s.guestName}, this is ${S.venue.name || "the front desk"}. Your current bill is ${money(stayTotal(s))}; balance ${money(stayBal(s))}. Checkout is on ${fmtDay(s.checkOut)}.`
      : `Hello ${s.guestName}, your room reservation at ${S.venue.name || "our centre"} is confirmed: Room ${roomNames(s)}, ${fmtDay(s.checkIn)} to ${fmtDay(s.checkOut)} (${nightsOf(s)} night${nightsOf(s) > 1 ? "s" : ""}), ${money(stayRoomTotal(s))}. We look forward to hosting you.`;
  window.open("https://wa.me/" + ph + "?text=" + encodeURIComponent(msg), "_blank");
}

export const shareReceiptAction = () => {
  const s = ui.rc.s;
  const t =
    (S.venue.name || "Receipt") +
    " · " +
    s.no +
    "\n" +
    s.items.map((i) => i.qty + " x " + i.name + "  " + money(i.qty * i.price)).join("\n") +
    "\nTotal: " +
    money(s.total);
  window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank");
};
