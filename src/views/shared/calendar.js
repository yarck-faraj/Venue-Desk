import { S, ui } from "../../state/store.js";
import { fmtDay, fmtTime, isoDay, today } from "../../domain/dates.js";
import { onDay } from "../../domain/bookings.js";
import { spaceColor } from "../../state/selectors.js";
import { esc } from "../../utils/dom.js";
import { MONTHS } from "../../config/constants.js";
import { bookingRow } from "./booking-row.js";

export function vCal() {
  const m = ui.month,
    y = m.getFullYear(),
    mo = m.getMonth(),
    t = today();
  const first = new Date(y, mo, 1),
    lead = (first.getDay() + 6) % 7,
    start = new Date(y, mo, 1 - lead);
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
      k = isoDay(d);
    const ev = S.bookings.filter(
      (b) => onDay(b, k) && (!ui.spaceFilter || (b.spaceIds || []).includes(ui.spaceFilter)),
    );
    cells += `<div class="d ${d.getMonth() !== mo ? "out" : ""} ${k === t ? "today" : ""} ${k === ui.day ? "sel" : ""}" data-a="day" data-day="${k}"><b>${d.getDate()}</b>${ev
      .slice(0, 2)
      .map(
        (b) =>
          `<i class="event-chip event-${esc(b.status)}" style="--event-color:${spaceColor((b.spaceIds || [])[0])}" title="${esc(b.title)}">${esc(b.title)}</i>`,
      )
      .join("")}${ev.length > 2 ? `<i style="background:#999">+${ev.length - 2} more</i>` : ""}</div>`;
  }
  const dayEv = S.bookings.filter((b) => onDay(b, ui.day)).sort((a, b) => a.start.localeCompare(b.start));
  const avail = S.spaces
    .map((s) => {
      const n = dayEv.filter((b) => (b.spaceIds || []).includes(s.id));
      return `<div class="row"><span style="width:10px;height:10px;border-radius:50%;background:${spaceColor(s.id)}"></span><div class="grow t">${esc(s.name)}</div>${n.length ? `<span class="s">${n.map((b) => esc(fmtTime(b.start) + "–" + fmtTime(b.end))).join(", ")}</span>` : '<span class="free">Free all day</span>'}</div>`;
    })
    .join("");
  return `<div class="bar"><button class="btn alt sm" data-a="prevMonth">‹</button><b class="grow" style="text-align:center">${MONTHS[mo]} ${y}</b><button class="btn alt sm" data-a="nextMonth">›</button><button class="btn alt sm" data-a="thisMonth">Today</button></div>
    <div class="bar"><select data-a="spaceFilter" style="max-width:220px"><option value="">All halls</option>${S.spaces.map((s) => `<option value="${s.id}" ${ui.spaceFilter === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div>
    <div class="cal">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => `<div class="h">${x}</div>`).join("")}${cells}</div>
    <div class="card" style="margin-top:12px"><h2>${esc(fmtDay(ui.day))}<button class="btn gold sm" data-a="newBooking">+ Book</button></h2>${avail || ""}${dayEv.map((b) => bookingRow(b)).join("")}</div>`;
}
