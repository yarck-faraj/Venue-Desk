import { S } from "../../state/store.js";
import { esc } from "../../utils/dom.js";
import { money, roomWd, roomWe } from "../../state/selectors.js";

export function vPrices() {
  const halls = S.spaces.slice().sort((a, b) => a.name.localeCompare(b.name)),
    rooms = S.rooms.slice().sort((a, b) => a.name.localeCompare(b.name));
  return `<div class="card"><h2>Halls and event areas</h2><div class="s">Price per day. Only the owner can change prices.</div>${halls.map((h) => `<div class="row"><div class="grow t">${esc(h.name)}${h.capacity ? ` <span class="s">· ${h.capacity} guests</span>` : ""}</div><div class="s">Weekday ${money(h.rateWeekday || h.rate)}</div><div class="amt">Weekend ${money(h.rateWeekend || h.rateWeekday || h.rate)}</div></div>`).join("") || '<div class="empty">No halls yet.</div>'}</div>
  <div class="card"><h2>Rooms</h2><div class="s">Price per night. Weekend = Saturday and Sunday nights.</div>${rooms.map((r) => `<div class="row"><div class="grow t">${esc(r.name)}${r.type ? ` <span class="s">· ${esc(r.type)}</span>` : ""}</div><div class="s">Weekday ${money(roomWd(r))}</div><div class="amt">Weekend ${money(roomWe(r))}</div></div>`).join("") || '<div class="empty">No rooms yet.</div>'}</div>`;
}
