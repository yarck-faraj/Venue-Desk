import { balanceOf, byId, chargesOf, liveStay, money, overview, stayBal } from "../../state/selectors.js";
import { filterButtons, moneySeg } from "../../components/seg.js";
import { S, ui } from "../../state/store.js";
import { kpi } from "../../components/kpi.js";
import { amountRow } from "../../components/row.js";
import { esc } from "../../utils/dom.js";
import { METHODS } from "../../config/constants.js";
import { num } from "../../domain/money.js";

export function vOverview() {
  const {
    payIn,
    posCash,
    charged,
    exp,
    crew,
    cin,
    profit,
    oldAmt,
    byOut,
    prod,
    byM,
    byS,
    disc,
    voids,
    odd,
    low,
    sval,
    days,
    vals,
    mx,
    evs,
    roomRev,
    stayN,
    occPct,
  } = overview();
  const seg = filterButtons(
    [
      ["today", "Today"],
      ["week", "7 days"],
      ["month", "This month"],
      ["q", "90 days"],
    ],
    ui.period,
    "period",
  );

  return `<div class="bar"><div class="seg">${moneySeg()}<button data-a="moneyTab" data-k="payments">Payments in</button><button data-a="moneyTab" data-k="expenses">Expenses out</button></div></div>
  <div class="bar"><div class="seg">${seg}</div></div>
  <div class="kpis k6">${kpi("Cash in", money(cin), "pos")}${kpi("Costs out", money(exp + crew))}${kpi("Profit (cash basis)", money(profit), profit < 0 ? "neg" : "pos")}
  ${kpi("POS sales", money(posCash + charged))}${kpi("Booking and room payments", money(payIn))}${kpi("Charged to events/rooms", money(charged))}</div>
  ${oldAmt ? `<p class="s" style="margin:-4px 0 12px">Includes ${money(oldAmt)} from old paper records logged in the app (More &gt; Old sales).</p>` : ""}
  <div class="card"><h2>Cash in, last 14 days</h2><div class="bars">${vals.map((v) => `<div style="height:${Math.round((v / mx) * 100)}%" title="${money(v)}"></div>`).join("")}</div><div class="mini">${days.map((d) => `<span>${d.slice(8)}</span>`).join("")}</div></div>
  <div class="card"><h2>Sales by outlet</h2>${
    Object.entries(byOut)
      .sort((a, b) => b[1].rev - a[1].rev)
      .map(([id, o]) =>
        amountRow(
          `<div class="t">${esc((byId("outlets", id) || { name: "(removed)" }).name)}</div><div class="s">Est. margin ${o.cost ? money(o.rev - o.cost) + " (" + Math.round(((o.rev - o.cost) / o.rev) * 100) + "%)" : "add stock costs to see margin"}</div>`,
          money(o.rev),
        ),
      )
      .join("") || '<div class="empty">No sales in this period.</div>'
  }
    ${
      Object.keys(byM).length
        ? `<div class="s" style="margin-top:8px">${Object.entries(byM)
            .map(([m, v]) => esc(METHODS[m] || m) + ": " + money(v))
            .join(" · ")}</div>`
        : ""
    }</div>
  <div class="card"><h2>Top products</h2>${
    Object.entries(prod)
      .sort((a, b) => b[1].rev - a[1].rev)
      .slice(0, 8)
      .map(([n, p]) =>
        amountRow(`<div class="t">${esc(n)}</div><div class="s">${p.q} sold</div>`, money(p.rev)),
      )
      .join("") || '<div class="empty">Nothing yet.</div>'
  }</div>
  <div class="card"><h2>Staff and controls</h2>${Object.entries(byS)
    .sort((a, b) => b[1].t - a[1].t)
    .map(([e, u]) =>
      amountRow(`<div class="t">${esc(e.split("@")[0])}</div><div class="s">${u.n} sales</div>`, money(u.t)),
    )
    .join("")}
    ${amountRow("Discounts given", money(disc), disc ? "neg" : "")}${amountRow("Voided sales", voids.length + (voids.length ? " · " + money(voids.reduce((a, s) => a + num(s.total), 0)) : ""), voids.length ? "neg" : "")}
    ${amountRow("Till differences", odd.length ? odd.map((s) => esc((s.staff || "").split("@")[0]) + " " + (s.diff > 0 ? "+" : "") + money(s.diff)).join(", ") : "None", odd.length ? "neg" : "pos")}</div>
  <div class="card"><h2>Hall and room bookings</h2>${amountRow("Events in period", evs.length)}${amountRow("Billed (price + bar charges)", money(evs.reduce((a, b) => a + num(b.price) + chargesOf(b.id), 0)))}${amountRow("Still owed on those events", money(evs.reduce((a, b) => a + Math.max(0, balanceOf(b)), 0)), "neg")}</div>
  ${S.rooms.length ? `<div class="card"><h2>Accommodation</h2>${amountRow("Occupancy", occPct + "%")}${amountRow("Room revenue (nights in period)", money(roomRev))}${amountRow("Guests staying in period", stayN)}${amountRow("Unpaid guest bills", money(S.stays.filter((x) => liveStay(x) && x.status !== "reserved").reduce((a, x) => a + Math.max(0, stayBal(x)), 0)), "neg")}</div>` : ""}
  <div class="card"><h2>Stock</h2>${amountRow("Stock value (at cost)", money(sval))}${low.map((i) => amountRow(`<span class="neg">Low: ${esc(i.name)}</span>`, num(i.qty) + " " + esc(i.unit || ""), "neg")).join("") || amountRow("Low-stock items", "None", "pos")}</div>
  <p class="s">Cash basis: money actually received, minus expenses and crew pay. Stock purchases count as expenses when you record them. Margin per outlet is an estimate from current stock costs. Sales history shown goes back 100 days.</p>`;
}
