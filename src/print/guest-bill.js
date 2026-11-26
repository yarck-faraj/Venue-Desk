import { byId, money, roomNames, stayBal, stayRoomLines, stayTotal } from "../state/selectors.js";
import { S } from "../state/store.js";
import { toast } from "../components/toast.js";
import { esc } from "../utils/dom.js";
import { fmtDay, today } from "../domain/dates.js";
import { num } from "../domain/money.js";

export function stayInvoice(id) {
  const s = byId("stays", id),
    pays = S.payments.filter((p) => p.stayId === id),
    pos = S.sales.filter((x) => x.stayId === id && x.method === "room" && x.status === "paid");
  const w = window.open("", "_blank");
  if (!w) {
    toast("Allow pop-ups to print");
    return;
  }
  w.document
    .write(`<!doctype html><title>Guest bill - ${esc(s.guestName)}</title><style>body{font:15px system-ui;max-width:680px;margin:30px auto;padding:0 20px;color:#222}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}td:last-child,th:last-child{text-align:right}.big{font-size:20px;font-weight:700}</style>
  <h1 style="margin:0">${esc(S.venue.name || "Venue")}</h1><div>${esc(S.venue.address || "")}</div><hr><h2>Guest bill</h2>
  <div>Date: ${fmtDay(today())}<br>Guest: <b>${esc(s.guestName)}</b>${s.phone ? " · " + esc(s.phone) : ""}<br>Room ${esc(roomNames(s))} · ${esc(fmtDay(s.checkIn))} → ${esc(fmtDay(s.checkOut))}</div>
  <table><tr><th>Description</th><th>Amount</th></tr>${stayRoomLines(s)
    .map((l) => `<tr><td>${esc(l[0])}</td><td>${money(l[1])}</td></tr>`)
    .join("")}
  ${(s.extras || []).map((e) => `<tr><td>${esc(e.t)}</td><td>${money(e.amount)}</td></tr>`).join("")}${pos.map((x) => `<tr><td>Bar / restaurant ${esc(x.no)}: ${esc(x.items.map((i) => i.qty + " " + i.name).join(", "))}</td><td>${money(x.total)}</td></tr>`).join("")}
  ${num(s.discount) ? `<tr><td>Discount</td><td>-${money(s.discount)}</td></tr>` : ""}<tr><td><b>Total</b></td><td><b>${money(stayTotal(s))}</b></td></tr>
  ${pays.map((p) => `<tr><td>${esc(p.type)} received ${esc(p.date || "")} (${esc(p.method || "")})</td><td>${p.type === "refund" ? "" : "-"}${money(p.amount)}</td></tr>`).join("")}<tr><td class="big">Balance due</td><td class="big">${money(stayBal(s))}</td></tr></table>
  <p>Thank you for staying with ${esc(S.venue.name || "us")}.</p><script>setTimeout(()=>print(),300)<\/script>`);
  w.document.close();
}
