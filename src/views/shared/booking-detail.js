import {
  balanceOf,
  byId,
  chargesOf,
  conflicts,
  costOf,
  crewPayOf,
  money,
  paidOf,
  spaceName,
} from "../../state/selectors.js";
import { S } from "../../state/store.js";
import { esc } from "../../utils/dom.js";
import { live } from "../../domain/bookings.js";
import { fmtRange } from "../../domain/dates.js";
import { kpi } from "../../components/kpi.js";
import { num } from "../../domain/money.js";
import { isOwner } from "../../state/session.js";

/* ---------- booking detail ---------- */
export function vDetail(b) {
  const paid = paidOf(b.id),
    bal = balanceOf(b),
    pays = S.payments
      .filter((p) => p.bookingId === b.id)
      .sort((a, c) => (a.date || "").localeCompare(c.date || ""));
  const exps = S.expenses.filter((e) => e.bookingId === b.id),
    cost = costOf(b),
    profit = paid - cost;
  const cl = byId("clients", b.clientId),
    cf = conflicts(b),
    charges = chargesOf(b.id),
    chSales = S.sales.filter((x) => x.bookingId === b.id && x.method === "booking" && x.status === "paid");
  return `<div class="overlay" data-a="closeSheetBg"><div class="sheet"><h3>${esc(b.title)}<button class="x" data-a="closeSheet">×</button></h3>
    ${cf.length && live(b) ? `<div class="warn"><b>Double-booked</b> with ${cf.map((x) => esc(x.title)).join(", ")}.</div>` : ""}
    <div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><div><span class="badge b-${b.status}">${b.status}</span><div style="margin-top:8px">${esc(fmtRange(b))}</div><div class="s">${esc((b.spaceIds || []).map(spaceName).join(" + "))}${b.guests ? " · " + b.guests + " guests" : ""}</div>${cl ? `<div class="s">${esc(cl.name)}${cl.phone ? " · " + esc(cl.phone) : ""}</div>` : ""}</div></div>${b.notes ? `<p class="s">${esc(b.notes)}</p>` : ""}
    <div class="bar" style="margin:10px 0 0"><button class="btn sm" data-a="editBooking" data-id="${b.id}">Edit</button><button class="btn alt sm" data-a="invoice" data-id="${b.id}">Invoice</button>${cl && cl.phone ? `<button class="btn alt sm" data-a="wa" data-id="${b.id}">WhatsApp reminder</button>` : ""}${b.status === "hold" ? `<button class="btn gold sm" data-a="confirmHold" data-id="${b.id}">Confirm</button>` : ""}</div></div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">${kpi("Billed", money(num(b.price) + charges))}${kpi("Paid", money(paid), "pos")}${kpi("Balance", money(bal), bal > 0.005 ? "neg" : "pos")}</div>
    <div class="card"><h2>Payments <button class="btn gold sm" data-a="newPayment" data-id="${b.id}">+ Payment</button></h2>${pays.map((p) => `<div class="row tap" data-a="editPayment" data-id="${p.id}"><div class="grow"><div class="t">${esc(p.type)}</div><div class="s">${esc(p.date || "")} · ${esc(p.method || "")}</div></div><div class="amt ${p.type === "refund" ? "neg" : "pos"}">${p.type === "refund" ? "-" : ""}${money(p.amount)}</div></div>`).join("") || '<div class="empty">No payments yet.</div>'}</div>
    ${chSales.length ? `<div class="card"><h2>Charged from bar / restaurant</h2>${chSales.map((x) => `<div class="row tap" data-a="openSale" data-id="${x.id}"><div class="grow"><div class="t">${esc(x.label || "Receipt " + x.no)}</div><div class="s">${esc(x.items.map((i) => i.qty + " " + i.name).join(", "))}</div></div><div class="amt">${money(x.total)}</div></div>`).join("")}</div>` : ""}
    ${
      !isOwner()
        ? ""
        : `<div class="card"><h2>Costs and profit <button class="btn alt sm" data-a="newExpense" data-id="${b.id}">+ Expense</button></h2>
      ${(b.crew || []).map((c) => `<div class="row"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.role)} (crew)</div></div><div class="amt">${money(crewPayOf(b, c))}</div></div>`).join("")}
      ${exps.map((e) => `<div class="row tap" data-a="editExpense" data-id="${e.id}"><div class="grow"><div class="t">${esc(e.note || e.category)}</div><div class="s">${esc(e.category)}</div></div><div class="amt">${money(e.amount)}</div></div>`).join("")}
      <div class="row"><div class="grow t">Profit so far (paid − costs)</div><div class="amt ${profit < 0 ? "neg" : "pos"}">${money(profit)}</div></div></div>`
    }
    <div class="card"><h2>Checklist <button class="btn alt sm" data-a="addCheck" data-id="${b.id}">+ Item</button></h2>${(b.checklist || []).map((c, i) => `<label class="chk ${c.done ? "done" : ""}"><input type="checkbox" data-a="toggleCheck" data-id="${b.id}" data-i="${i}" ${c.done ? "checked" : ""}><span>${esc(c.t)}</span></label>`).join("") || '<div class="empty">No checklist.</div>'}</div>
  </div></div>`;
}
