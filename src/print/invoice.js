import { balanceOf, byId, money, spaceName } from "../state/selectors.js";
import { S } from "../state/store.js";
import { toast } from "../components/toast.js";
import { esc } from "../utils/dom.js";
import { fmtDay, fmtRange, today } from "../domain/dates.js";

export function invoice(id) {
  const b = byId("bookings", id),
    cl = byId("clients", b.clientId),
    pays = S.payments.filter((p) => p.bookingId === id);
  const w = window.open("", "_blank");
  if (!w) {
    toast("Allow pop-ups to print the invoice");
    return;
  }
  w.document
    .write(`<!doctype html><title>Invoice - ${esc(b.title)}</title><style>body{font:15px system-ui;max-width:680px;margin:30px auto;padding:0 20px;color:#222}h1{margin:0}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}td:last-child,th:last-child{text-align:right}.big{font-size:20px;font-weight:700}</style>
  <h1>${esc(S.venue.name || "Venue")}</h1><div>${esc(S.venue.address || "")}</div><hr><h2>Invoice</h2>
  <div>Date: ${fmtDay(today())}<br>${cl ? "Billed to: <b>" + esc(cl.name) + "</b><br>" : ""}Event: <b>${esc(b.title)}</b><br>${esc(fmtRange(b))}<br>${esc((b.spaceIds || []).map(spaceName).join(" + "))}</div>
  <table><tr><th>Description</th><th>Amount</th></tr><tr><td>Venue hire and services: ${esc(b.title)}</td><td>${money(b.price)}</td></tr>${S.sales
    .filter((x) => x.bookingId === id && x.method === "booking" && x.status === "paid")
    .map(
      (x) =>
        `<tr><td>Bar / restaurant charge ${esc(x.no)}: ${esc(x.items.map((i) => i.qty + " " + i.name).join(", "))}</td><td>${money(x.total)}</td></tr>`,
    )
    .join("")}
  ${pays.map((p) => `<tr><td>${esc(p.type)} received ${esc(p.date || "")} (${esc(p.method || "")})</td><td>${p.type === "refund" ? "" : "-"}${money(p.amount)}</td></tr>`).join("")}
  <tr><td class="big">Balance due</td><td class="big">${money(balanceOf(b))}</td></tr></table><p>Thank you for choosing ${esc(S.venue.name || "us")}.</p><script>setTimeout(()=>print(),300)<\/script>`);
  w.document.close();
}
