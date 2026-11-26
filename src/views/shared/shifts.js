import { myShift } from "../../state/shift.js";
import { isTill, myEmail } from "../../state/session.js";
import { money, shiftStats } from "../../state/selectors.js";
import { esc } from "../../utils/dom.js";
import { kpi } from "../../components/kpi.js";
import { S } from "../../state/store.js";
import { num } from "../../domain/money.js";

/* ---------- POS views ---------- */
export function vShift() {
  const sh = myShift(),
    mine = isTill();
  let html = "";
  if (sh) {
    const st = shiftStats(sh);
    html += `<div class="card"><h2>My open shift</h2><div class="s">Opened ${esc(new Date(sh.openedAt).toLocaleString())} · float ${money(sh.float)}</div>
    <div class="kpis" style="margin-top:10px">${kpi("Sales", st.n)}${kpi("Cash taken", money(st.by.cash || 0))}${kpi("Mobile money", money(st.by.momo || 0))}${kpi("Card", money(st.by.card || 0))}</div>
    <div class="row"><div class="grow t">Cash that should be in the till</div><div class="amt">${money(st.expected)}</div></div><button class="btn gold" style="margin-top:10px" data-a="closeShift">Close shift and count cash</button></div>`;
  } else
    html += `<div class="card"><h2>No open shift</h2><button class="btn gold" data-a="openShift">Open shift</button></div>`;
  const hist = S.shifts
    .filter((s) => s.closedAt && (!mine || s.staff === myEmail()))
    .sort((a, b) => b.closedAt - a.closedAt)
    .slice(0, 30);
  html += `<div class="card"><h2>Closed shifts</h2>${hist.map((s) => `<div class="row"><div class="grow"><div class="t">${esc((s.staff || "").split("@")[0])} · ${esc(s.date)}</div><div class="s">Expected ${money(s.expected)} · counted ${money(s.counted)}</div></div><div class="amt ${Math.abs(num(s.diff)) > 0.005 ? "neg" : "pos"}">${Math.abs(num(s.diff)) < 0.005 ? "Balanced" : (s.diff > 0 ? "+" : "") + money(s.diff)}</div></div>`).join("") || '<div class="empty">None yet.</div>'}</div>`;
  if (!mine)
    html = `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button></div>` + html;
  return html;
}
