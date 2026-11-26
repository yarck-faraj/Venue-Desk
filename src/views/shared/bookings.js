import { today } from "../../domain/dates.js";
import { S, ui } from "../../state/store.js";
import { live } from "../../domain/bookings.js";
import { balanceOf } from "../../state/selectors.js";
import { filterButtons } from "../../components/seg.js";
import { esc } from "../../utils/dom.js";
import { bookingRow } from "./booking-row.js";

export function vBookings() {
  const t = today(),
    q = ui.q.toLowerCase();
  let list = S.bookings.slice();
  if (ui.bookFilter === "upcoming")
    list = list
      .filter((b) => live(b) && b.end.slice(0, 10) >= t)
      .sort((a, b) => a.start.localeCompare(b.start));
  else if (ui.bookFilter === "past")
    list = list
      .filter((b) => b.end.slice(0, 10) < t && live(b))
      .sort((a, b) => b.start.localeCompare(a.start));
  else if (ui.bookFilter === "owing")
    list = list.filter((b) => live(b) && balanceOf(b) > 0.005).sort((a, b) => a.start.localeCompare(b.start));
  else if (ui.bookFilter === "cancelled")
    list = list.filter((b) => !live(b)).sort((a, b) => b.start.localeCompare(a.start));
  if (q) list = list.filter((b) => (b.title + " " + (b.clientName || "")).toLowerCase().includes(q));
  const seg = filterButtons(
    [
      ["upcoming", "Upcoming"],
      ["owing", "Owing"],
      ["past", "Past"],
      ["cancelled", "Cancelled"],
    ],
    ui.bookFilter,
    "bookFilter",
  );
  return `<div class="bar"><div class="seg">${seg}</div><span class="grow"></span><button class="btn gold sm" data-a="newBooking">+ New</button></div>
    <div class="bar"><input id="q" placeholder="Search event or client" value="${esc(ui.q)}"></div>
    <div class="card">${list.map((b) => bookingRow(b, true)).join("") || '<div class="empty">No bookings here.</div>'}</div>`;
}
