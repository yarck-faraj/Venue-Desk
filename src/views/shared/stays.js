import {
  effEnd,
  liveStay,
  money,
  nightsOf,
  roomNames,
  roomRateText,
  roomState,
  roomWd,
  stayBal,
} from "../../state/selectors.js";
import { esc } from "../../utils/dom.js";
import { addDays, fmtDay, today, ymd } from "../../domain/dates.js";
import { stayBadge } from "../../components/badge.js";
import { filterButtons } from "../../components/seg.js";
import { S, ui } from "../../state/store.js";
import { canManage } from "../../state/session.js";
import { STATE_LABEL } from "../../config/constants.js";
import { kpi } from "../../components/kpi.js";

function stayRow(s, bal) {
  const b = stayBal(s);
  return `<div class="row tap" data-a="openStay" data-id="${s.id}"><div class="grow"><div class="t">${esc(s.guestName)}</div><div class="s">Room ${esc(roomNames(s))} · ${esc(fmtDay(s.checkIn))} → ${esc(fmtDay(s.checkOut))} (${nightsOf(s)} night${nightsOf(s) > 1 ? "s" : ""})</div></div><div style="text-align:right">${stayBadge(s)}${bal && liveStay(s) && b > 0.005 ? `<div class="amt neg" style="margin-top:4px">${money(b)} due</div>` : ""}</div></div>`;
}

/* ---------- Rooms tab ---------- */
export function vStayTab() {
  const t = today(),
    seg = filterButtons(
      [
        ["board", "Today"],
        ["list", "Stays"],
        ["cal", "Timeline"],
      ],
      ui.stayMode,
      "stayMode",
    );
  const head = `<div class="bar"><div class="seg">${seg}</div><span class="grow"></span><button class="btn gold sm" data-a="newStay">+ New stay</button></div>`;
  if (!S.rooms.length)
    return (
      head +
      `<div class="card"><h2>Add your guest rooms</h2><p>Set up each room with its type and nightly rate. Meeting and conference rooms stay under Halls and spaces.</p>${canManage() ? '<button class="btn" data-a="newRoom">Add a room</button>' : ""}</div>`
    );
  if (ui.stayMode === "list") {
    const q = ui.sq.toLowerCase(),
      f = ui.stayFilter;
    let l = S.stays.slice();
    if (f === "inhouse") l = l.filter((s) => s.status === "checkedin");
    else if (f === "upcoming") l = l.filter((s) => s.status === "reserved");
    else if (f === "past") l = l.filter((s) => s.status === "checkedout");
    else if (f === "owing") l = l.filter((s) => liveStay(s) && stayBal(s) > 0.005);
    else l = l.filter((s) => !liveStay(s));
    if (q)
      l = l.filter((s) =>
        (s.guestName + " " + roomNames(s) + " " + (s.phone || "")).toLowerCase().includes(q),
      );
    l.sort((a, b) =>
      f === "past" ? b.checkIn.localeCompare(a.checkIn) : a.checkIn.localeCompare(b.checkIn),
    );
    const fs_ = [
      ["inhouse", "In-house"],
      ["upcoming", "Reserved"],
      ["owing", "Owing"],
      ["past", "Past"],
      ["cancelled", "Cancelled"],
    ]
      .map(
        ([k, lab]) =>
          `<button class="${f === k ? "on" : ""}" data-a="stayFilter" data-k="${k}">${lab}</button>`,
      )
      .join("");
    return (
      head +
      `<div class="bar"><div class="seg">${fs_}</div></div><div class="bar"><input id="sq" placeholder="Search guest, room or phone" value="${esc(ui.sq)}"></div><div class="card">${l.map((s) => stayRow(s, true)).join("") || '<div class="empty">No stays here.</div>'}</div>`
    );
  }
  if (ui.stayMode === "cal") {
    const days = Array.from({ length: 14 }, (_, i) => addDays(ui.stayStart, i));
    const hdr = days
      .map(
        (d) =>
          `<div class="th ${d === t ? "tdy" : ""}">${new Date(ymd(d) + 12 * 36e5).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" }).slice(0, 2)}<br>${d.slice(8)}</div>`,
      )
      .join("");
    const rows = S.rooms
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((r) => {
        const cells = days
          .map((d, i) => {
            const s = S.stays.find(
              (x) => liveStay(x) && (x.roomIds || []).includes(r.id) && x.checkIn <= d && d < effEnd(x),
            );
            if (!s) return `<div class="tc" data-a="newStayCell" data-room="${r.id}" data-day="${d}"></div>`;
            return `<div class="tc st-${s.status}" data-a="openStay" data-id="${s.id}" title="${esc(s.guestName)}">${d === s.checkIn || i === 0 ? esc(s.guestName.split(" ")[0]) : ""}</div>`;
          })
          .join("");
        return `<div class="tr">${esc(r.name)}<small>${esc(r.type || "")}</small></div>${cells}`;
      })
      .join("");
    return (
      head +
      `<div class="bar"><button class="btn alt sm" data-a="stayPrev">‹ Week</button><span class="grow" style="text-align:center"><b>${esc(fmtDay(days[0]))}</b></span><button class="btn alt sm" data-a="stayNext">Week ›</button><button class="btn alt sm" data-a="stayToday">Today</button></div>
      <div class="tlwrap"><div class="tl" style="grid-template-columns:96px repeat(14,44px)"><div></div>${hdr}${rows}</div></div>
      <p class="s">Gold = reserved · green = in-house · grey = checked out. Tap an empty cell to book that room and night.</p>`
    );
  }
  // Today board
  const arriving = S.stays
    .filter((s) => s.status === "reserved" && s.checkIn <= t)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const inhouse = S.stays.filter((s) => s.status === "checkedin"),
    dueOut = inhouse.filter((s) => s.checkOut <= t);
  const occ = S.rooms.filter((r) => roomState(r) === "occupied").length,
    dirty = S.rooms.filter((r) => roomState(r) === "dirty").length;
  const rooms = S.rooms
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((r) => {
      const st = roomState(r),
        g = S.stays.find((s) => s.status === "checkedin" && (s.roomIds || []).includes(r.id));
      return `<div class="rm rm-${st}" data-a="roomTap" data-id="${r.id}"><b>${esc(r.name)}</b><span>${esc(r.type || "")}${roomWd(r) ? " · " + roomRateText(r, true) : ""}</span><em>${g ? esc(g.guestName) + " · out " + esc(fmtDay(g.checkOut).split(",")[0]) : STATE_LABEL[st]}</em></div>`;
    })
    .join("");
  return (
    head +
    `<div class="kpis"><div class="kpi"><span>Occupied</span><b>${occ} / ${S.rooms.length}</b></div>${kpi("Arrivals due", arriving.length)}${kpi("Departures due", dueOut.length)}${kpi("To clean", dirty, dirty ? "neg" : "")}</div>
    ${arriving.length ? `<div class="card"><h2>Arrivals</h2>${arriving.map((s) => stayRow(s)).join("")}</div>` : ""}
    ${dueOut.length ? `<div class="card"><h2>Departures due</h2>${dueOut.map((s) => stayRow(s, true)).join("")}</div>` : ""}
    <div class="card"><h2>Rooms right now</h2><div class="rmgrid">${rooms}</div></div>
    ${inhouse.length ? `<div class="card"><h2>In-house guests</h2>${inhouse.map((s) => stayRow(s, true)).join("")}</div>` : ""}`
  );
}
