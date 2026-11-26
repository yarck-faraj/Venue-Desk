import {
  liveStay,
  money,
  nightsOf,
  roomNames,
  stayBal,
  stayConflicts,
  stayPaid,
  stayRoomLines,
  stayRoomTotal,
  stayTotal,
} from "../../state/selectors.js";
import { S } from "../../state/store.js";
import { esc } from "../../utils/dom.js";
import { stayBadge } from "../../components/badge.js";
import { fmtDay } from "../../domain/dates.js";
import { kpi } from "../../components/kpi.js";
import { num } from "../../domain/money.js";

/* ---------- stay detail ---------- */
export function vStayDetail(s) {
  const n = nightsOf(s),
    rc = stayRoomTotal(s),
    ex = s.extras || [],
    pos = S.sales.filter((x) => x.stayId === s.id && x.method === "room" && x.status === "paid");
  const pays = S.payments
      .filter((p) => p.stayId === s.id)
      .sort((a, b) => (a.date || "").localeCompare(b.date || "")),
    paid = stayPaid(s.id),
    bal = stayBal(s),
    cf = liveStay(s) ? stayConflicts(s) : [];
  const acts =
    s.status === "reserved"
      ? `<button class="btn gold sm" data-a="checkIn" data-id="${s.id}">Check in</button>`
      : s.status === "checkedin"
        ? `<button class="btn gold sm" data-a="checkOut" data-id="${s.id}">Check out</button>`
        : "";
  return `<div class="overlay" data-a="closeSheetBg"><div class="sheet"><h3>${esc(s.guestName)}<button class="x" data-a="closeSheet">×</button></h3>
    ${cf.length ? `<div class="warn"><b>Room clash</b> with ${cf.map((x) => esc(x.guestName)).join(", ")}.</div>` : ""}
    <div class="card">${stayBadge(s)}<div style="margin-top:8px"><b>Room ${esc(roomNames(s))}</b></div><div>${esc(fmtDay(s.checkIn))} → ${esc(fmtDay(s.checkOut))} · ${n} night${n > 1 ? "s" : ""}</div>
      <div class="s">${s.adults ? s.adults + " guest" + (s.adults > 1 ? "s" : "") : ""}${s.phone ? " · " + esc(s.phone) : ""}${s.idNo ? " · ID " + esc(s.idNo) : ""}${s.source ? " · " + esc(s.source) : ""}</div>${s.notes ? `<p class="s">${esc(s.notes)}</p>` : ""}
      <div class="bar" style="margin:10px 0 0">${acts}<button class="btn sm" data-a="editStay" data-id="${s.id}">Edit</button><button class="btn alt sm" data-a="stayInvoice" data-id="${s.id}">Guest bill</button>${s.phone ? `<button class="btn alt sm" data-a="stayWa" data-id="${s.id}">WhatsApp</button>` : ""}</div></div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">${kpi("Total bill", money(stayTotal(s)))}${kpi("Paid", money(paid), "pos")}${kpi("Balance", money(bal), bal > 0.005 ? "neg" : "pos")}</div>
    <div class="card"><h2>Bill</h2><div class="row"><div class="grow"><div class="t">Room ${esc(roomNames(s))}</div><div class="s">${stayRoomLines(
      s,
    )
      .map(
        (l) =>
          esc(l[0].replace("Accommodation: ", "")) + (stayRoomLines(s).length > 1 ? " " + money(l[1]) : ""),
      )
      .join(" · ")}</div></div><div class="amt">${money(rc)}</div></div>
      ${ex.map((e, i) => `<div class="row tap" data-a="editExtra" data-id="${s.id}" data-i="${i}"><div class="grow t">${esc(e.t)}</div><div class="amt">${money(e.amount)}</div></div>`).join("")}
      ${pos.map((x) => `<div class="row tap" data-a="openSale" data-id="${x.id}"><div class="grow"><div class="t">${esc(x.label || "Bar / restaurant " + x.no)}</div><div class="s">${esc(x.items.map((i) => i.qty + " " + i.name).join(", "))}</div></div><div class="amt">${money(x.total)}</div></div>`).join("")}
      ${num(s.discount) ? `<div class="row"><div class="grow t">Discount</div><div class="amt neg">-${money(s.discount)}</div></div>` : ""}
      <div style="margin-top:8px"><button class="btn alt sm" data-a="addExtra" data-id="${s.id}">+ Extra charge</button></div></div>
    <div class="card"><h2>Payments <button class="btn gold sm" data-a="stayPay" data-id="${s.id}">+ Payment</button></h2>${pays.map((p) => `<div class="row tap" data-a="editPayment" data-id="${p.id}"><div class="grow"><div class="t">${esc(p.type)}</div><div class="s">${esc(p.date || "")} · ${esc(p.method || "")}</div></div><div class="amt ${p.type === "refund" ? "neg" : "pos"}">${p.type === "refund" ? "-" : ""}${money(p.amount)}</div></div>`).join("") || '<div class="empty">No payments yet.</div>'}</div></div></div>`;
}
