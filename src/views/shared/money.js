import { S, ui } from "../../state/store.js";
import { isOwner } from "../../state/session.js";
import { byId, money, monthlyCash, payTitle } from "../../state/selectors.js";
import { esc } from "../../utils/dom.js";
import { MONTHS } from "../../config/constants.js";
import { moneySeg } from "../../components/seg.js";

export function vMoney(vOverview, vExpenses) {
  if (ui.money === "overview" && isOwner()) return vOverview();
  if (ui.money === "expenses" && isOwner()) return vExpenses();
  const pay = S.payments.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const exp = S.expenses.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const rows =
    ui.money === "payments"
      ? pay
          .map(
            (p) =>
              `<div class="row tap" data-a="editPayment" data-id="${p.id}"><div class="grow"><div class="t">${esc(payTitle(p))}</div><div class="s">${esc(p.date || "")} · ${esc(p.type)} · ${esc(p.method || "")}${p.note ? " · " + esc(p.note) : ""}</div></div><div class="amt ${p.type === "refund" ? "neg" : "pos"}">${p.type === "refund" ? "-" : "+"}${money(p.amount)}</div></div>`,
          )
          .join("")
      : exp
          .map((e) => {
            const b = byId("bookings", e.bookingId),
              v = byId("vendors", e.vendorId);
            return `<div class="row tap" data-a="editExpense" data-id="${e.id}"><div class="grow"><div class="t">${esc(e.note || e.category)}</div><div class="s">${esc(e.date || "")} · ${esc(e.category)}${v ? " · " + esc(v.name) : ""}${b ? " · " + esc(b.title) : ""}</div></div><div class="amt">${money(e.amount)}</div></div>`;
          })
          .join("");
  const { months, crewByMonth } = monthlyCash();
  const sum = Object.keys(months)
    .sort()
    .reverse()
    .slice(0, 6)
    .map((k) => {
      const m = months[k],
        out = m.out + (crewByMonth[k] || 0);
      if (!isOwner())
        return `<div class="row"><div class="grow t">${MONTHS[+k.slice(5) - 1]} ${k.slice(0, 4)}</div><div class="amt pos">${money(m.in)}</div></div>`;
      return `<div class="row"><div class="grow t">${MONTHS[+k.slice(5) - 1]} ${k.slice(0, 4)}</div><div class="s">In ${money(m.in)} · Out ${money(out)}</div><div class="amt ${m.in - out < 0 ? "neg" : "pos"}">${money(m.in - out)}</div></div>`;
    })
    .join("");
  return `<div class="bar"><div class="seg">${moneySeg()}<button class="${ui.money === "payments" ? "on" : ""}" data-a="moneyTab" data-k="payments">Payments in</button>${isOwner() ? `<button class="${ui.money === "expenses" ? "on" : ""}" data-a="moneyTab" data-k="expenses">Expenses out</button>` : ""}</div><span class="grow"></span><button class="btn gold sm" data-a="${ui.money === "payments" ? "newPayment" : "newExpense"}">+ Add</button></div>
    <div class="card">${rows || '<div class="empty">Nothing recorded yet.</div>'}</div>
    <div class="card"><h2>${isOwner() ? "Monthly cash (payments received − expenses − crew pay)" : "Payments received by month"}</h2>${sum || '<div class="empty">No data yet.</div>'}</div>`;
}
