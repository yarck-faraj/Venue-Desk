import { balanceOf, byId, managerHome, money } from "../../state/selectors.js";
import { esc } from "../../utils/dom.js";
import { fmtDay } from "../../domain/dates.js";
import { kpi } from "../../components/kpi.js";

export function vManagerHome() {
  const { evs, onToday, arr, dep, inn, rec } = managerHome();
  const halls = (b) =>
      (b.spaceIds || [])
        .map((i) => (byId("spaces", i) || {}).name)
        .filter(Boolean)
        .join(", "),
    rooms = (x) =>
      (x.roomIds || [])
        .map((i) => (byId("rooms", i) || {}).name)
        .filter(Boolean)
        .join(", ");
  const ev = (b) => {
    const bal = balanceOf(b),
      priced = b.price !== undefined;
    return `<div class="row tap" data-a="goBook" data-id="${b.id}"><div class="grow"><div class="t">${esc(b.title || "Event")}</div><div class="s">${esc(fmtDay(b.start))} · ${esc(halls(b))}${b.clientName ? " · " + esc(b.clientName) : ""}</div></div><div style="text-align:right"><div class="amt">${priced ? money(b.price) : "Pricing…"}</div><div class="s ${priced && bal > 0.004 ? "neg" : ""}">${!priced ? "" : bal > 0.004 ? "Owes " + money(bal) : "Paid"}</div></div></div>`;
  };
  const gs = (x) =>
    `<div class="row tap" data-a="goStay" data-id="${x.id}"><div class="grow"><div class="t">${esc(x.guestName || "Guest")}</div><div class="s">${esc(rooms(x))}</div></div></div>`;
  return `<div class="kpis k4">${kpi("Events today", onToday.length)}${kpi("Events, next 14 days", evs.length)}${kpi("Guests in house", inn.length)}${kpi("Received this month", money(rec), "pos")}</div>
  <div class="card"><h2>Coming up <button class="btn gold sm" data-a="newBooking" style="float:right">+ New booking</button></h2>${evs.map(ev).join("") || '<div class="empty">Nothing booked in the next two weeks.</div>'}</div>
  <div class="mgrid"><div class="card"><h2>Arriving today <span>${arr.length}</span></h2>${arr.map(gs).join("") || '<div class="empty">No arrivals.</div>'}</div><div class="card"><h2>Leaving today <span>${dep.length}</span></h2>${dep.map(gs).join("") || '<div class="empty">No departures.</div>'}</div></div>`;
}
