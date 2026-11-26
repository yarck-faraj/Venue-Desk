import { money, receiptData } from "../state/selectors.js";
import { $, esc } from "../utils/dom.js";
import { METHODS, RECEIPT_ADDRESS, RECEIPT_PHONES } from "../config/constants.js";
import { num } from "../domain/money.js";
import { ui } from "../state/store.js";
import { canManage } from "../state/session.js";

export function receiptInner(s, change) {
  const { name, who, change: chg, tag } = receiptData(s, change);
  const row = (a, b) => `<tr><td>${a}</td><td style="text-align:right;white-space:nowrap">${b}</td></tr>`,
    line = '<div style="border-top:1px dashed #999;margin:8px 0"></div>';
  return `<div class="rc"><div style="text-align:center"><div style="font-size:12px;letter-spacing:3px">LYNN'S</div><b style="font-size:19px">${esc(name)}</b>
    <div class="s">Lynn's Event Center · ${esc(RECEIPT_ADDRESS)}</div><div class="s">${esc(RECEIPT_PHONES)}</div>${tag ? `<div class="s"><i>${esc(tag)}</i></div>` : ""}</div>${line}
    <div class="s" style="display:flex;justify-content:space-between;gap:8px"><span>Receipt #${esc(s.no)}</span><span>${esc(new Date(s.ts).toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }))}</span></div><div class="s">Served by ${esc(who)}</div>${line}
    <table style="width:100%;border-collapse:collapse">${s.items.map((i) => row(i.qty + " × " + esc(i.name), money(i.qty * i.price))).join("")}</table>${line}
    <table style="width:100%;border-collapse:collapse">${s.discount ? row("Discount", "-" + money(s.discount)) : ""}${row("<b>TOTAL</b>", '<b style="font-size:17px">' + money(s.total) + "</b>")}${s.status === "paid" ? row("Paid by " + esc(METHODS[s.method] || s.method), "") : ""}${s.method === "cash" && num(s.tendered) > 0 ? row("Cash received", money(s.tendered)) + row("Change", money(chg)) : ""}</table>
    ${s.status === "void" ? `<div style="text-align:center;margin-top:8px"><b>VOID</b> ${esc(s.voidReason || "")}</div>` : ""}${line}<div class="s" style="text-align:center">Thank you for choosing Lynn's!</div><div class="s" style="text-align:center">@lynnseventcenter</div></div>`;
}

export function showReceipt(s, change) {
  ui.rc = { s, change: change || 0 };
  $("#modal").innerHTML =
    `<div class="overlay"><div class="sheet"><h3>Receipt<button class="x" data-a="closeModal">×</button></h3><div class="card">${receiptInner(s, change)}</div>
    <div class="bar"><button class="btn" data-a="printReceipt">Print</button><button class="btn alt" data-a="shareReceipt">WhatsApp</button>${canManage() && s.status === "paid" ? '<button class="btn danger" data-a="voidSale">Void sale</button>' : ""}<button class="btn alt" data-a="closeModal">Done</button></div></div></div>`;
}
