import { S, ui } from "../../state/store.js";
import { esc } from "../../utils/dom.js";
import { live } from "../../domain/bookings.js";
import { byId, money, roomRateText, roomState, spaceColor } from "../../state/selectors.js";
import { me, staff } from "../../state/session.js";
import { STAFF_DOMAIN, STATE_LABEL } from "../../config/constants.js";
import { vDiag } from "../shared/diagnostics.js";
import { vStock } from "../shared/stock.js";
import { vProducts } from "../shared/products.js";
import { vShift } from "../shared/shifts.js";
import { vAudit } from "../shared/audit.js";
import { stockState } from "../../domain/stock.js";
import { lastBackup } from "../../state/persist.js";

export function vMore(vOldOwner) {
  if (ui.sub === "people") {
    const k = ui.peopleTab,
      list = S[k].slice().sort((a, b) => a.name.localeCompare(b.name));
    return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button><div class="seg"><button class="${k === "clients" ? "on" : ""}" data-a="peopleTab" data-k="clients">Clients</button><button class="${k === "vendors" ? "on" : ""}" data-a="peopleTab" data-k="vendors">Vendors</button></div><span class="grow"></span><button class="btn gold sm" data-a="newPerson">+ Add</button></div>
      <div class="card">${list.map((c) => `<div class="row tap" data-a="editPerson" data-id="${c.id}"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc([c.service, c.phone, c.email].filter(Boolean).join(" · "))}</div></div>${k === "clients" ? `<span class="s">${S.bookings.filter((b) => b.clientId === c.id && live(b)).length} events</span>` : ""}</div>`).join("") || '<div class="empty">None yet.</div>'}</div>`;
  }
  if (ui.sub === "spaces")
    return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button><span class="grow"></span><button class="btn gold sm" data-a="newSpace">+ Add hall</button></div>
    <div class="card">${S.spaces.map((s) => `<div class="row tap" data-a="editSpace" data-id="${s.id}"><span style="width:12px;height:12px;border-radius:50%;background:${spaceColor(s.id)}"></span><div class="grow"><div class="t">${esc(s.name)}</div><div class="s">${s.capacity ? s.capacity + " guests" : ""} ${s.rateWeekday || s.rate ? " · Weekday " + money(s.rateWeekday || s.rate) : ""}${s.rateWeekend ? " · Weekend " + money(s.rateWeekend) : ""}</div></div></div>`).join("") || '<div class="empty">Add your first hall.</div>'}</div>`;
  if (ui.sub === "staff")
    return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button></div>
    <div class="card"><h2>Staff access</h2><p class="s" style="margin-top:0">People on this list can sign in (they create their own account with the same email). Only the owner can delete payments and expenses.</p>
    ${staff.emails.map((e) => `<div class="row"><div class="grow t">${esc((staff.names || {})[e] || e)}</div>${e === staff.ownerEmail ? '<span class="badge b-confirmed">Owner</span>' : `<span class="badge b-hold">${esc(roleLabel(e))}</span><button class="btn alt sm" data-a="editStaff" data-k="${esc(e)}">Change role</button>${e.endsWith(STAFF_DOMAIN) ? `<button class="btn alt sm" data-a="resetPw" data-k="${esc(e)}">Reset password</button>` : ""}`}</div>`).join("")}
    <div style="margin-top:12px"><button class="btn" data-a="addStaff">+ Add staff</button></div></div>
    <div class="card"><h2>Roles</h2><p class="s" style="margin:0"><b>Cashier</b>: one bar only. Sells, prints receipts, starts and closes that bar's day. Cannot see payments, expenses, costs or reports.<br><b>Manager</b>: event center only: bookings, rooms and stays, clients, payments received. Sees prices but cannot change them. No expenses, crew pay or bar sales.<br><b>Owner</b>: everything, including prices, costs, expenses, crew pay and reports.</p></div>`;
  if (ui.sub === "diag") return vDiag();
  if (ui.sub === "stock") return vStock();
  if (ui.sub === "products") return vProducts();
  if (ui.sub === "outlets")
    return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button><span class="grow"></span><button class="btn gold sm" data-a="newOutlet">+ Add outlet</button></div>
    <div class="card">${S.outlets.map((o) => `<div class="row"><div class="grow tap" data-a="editOutlet" data-id="${o.id}"><div class="t">${esc(o.name)}</div><div class="s">${S.products.filter((p) => p.outletId === o.id).length} products</div></div><button class="btn alt sm" data-a="editOutlet" data-id="${o.id}">Edit</button><button class="btn danger sm" data-a="deleteOutlet" data-id="${o.id}">Delete</button></div>`).join("") || '<div class="empty">No outlets yet.</div>'}</div>`;
  if (ui.sub === "oldsales") return vOldOwner();
  if (ui.sub === "shifts") return vShift();
  if (ui.sub === "audit") return vAudit();
  if (ui.sub === "rooms")
    return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button><span class="grow"></span><button class="btn gold sm" data-a="newRoom">+ Add room</button></div>
    <div class="card">${
      S.rooms
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map(
          (r) =>
            `<div class="row tap" data-a="editRoom" data-id="${r.id}"><div class="grow"><div class="t">Room ${esc(r.name)} <span class="s">${esc(r.type || "")}</span></div><div class="s">${r.capacity ? "Sleeps " + r.capacity + " · " : ""}${esc(STATE_LABEL[roomState(r)])}</div></div><div class="amt">${roomRateText(r)}</div></div>`,
        )
        .join("") || '<div class="empty">Add your guest rooms.</div>'
    }</div>`;
  const item = (a, k, t, s) =>
    `<div class="row tap" data-a="${a}" data-k="${k}"><div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div><span class="s">›</span></div>`;
  const low = S.stock.filter((i) => stockState(i) !== "ok").length;
  return `<div class="card">${item("sub", "products", "Products and prices", S.products.length + " products")}${item("sub", "stock", "Stock", S.stock.length + " items" + (low ? " · <b class='neg'>" + low + " low</b>" : ""))}${item("sub", "rooms", "Guest rooms", S.rooms.length + " rooms")}${item("sub", "outlets", "Outlets", S.outlets.map((o) => esc(o.name)).join(", ") || "Cafe, bar, restaurant…")}${item("sub", "shifts", "Shifts and tills", "Cash counts per cashier")}${item("sub", "oldsales", "Old sales (paper records)", "Cut-off date, and what was logged")}</div>
    <div class="card">${item("sub", "people", "Clients and vendors", S.clients.length + " clients · " + S.vendors.length + " vendors")}${item("sub", "spaces", "Halls and meeting rooms", S.spaces.length + " set up")}${item("sub", "staff", "Staff access", staff.emails.length + " people")}${item("venue", "", "Venue settings", esc(S.venue.name || "Set venue name, currency, address")) + item("sub", "audit", "Activity log", "Voids, discounts, deletions, till differences")}</div>
    <div class="card">${item("diagRun", "", "Check setup", "Tests sign-in, database rules and saving. Use it if something will not save")}</div>
    <div class="card"><h2>Backup and restore</h2><p class="s" style="margin-top:0">Last backup downloaded: ${esc(lastBackup() || "never")}. Keep a copy on a flash drive or your email, not only on the PC.</p><div class="bar"><button class="btn sm" data-a="backup">Download full backup</button><button class="btn alt sm" data-a="restore">Restore from backup file</button></div><input type="file" id="restoreFile" accept=".json,application/json" hidden></div>
    <div class="card"><h2>Export (opens in Excel)</h2><div class="bar"><button class="btn alt sm" data-a="csv" data-k="bookings">Bookings</button><button class="btn alt sm" data-a="csv" data-k="sales">POS sales</button><button class="btn alt sm" data-a="csv" data-k="stays">Room stays</button><button class="btn alt sm" data-a="csv" data-k="payments">Payments</button><button class="btn alt sm" data-a="csv" data-k="expenses">Expenses</button></div></div>
    <div class="card"><div class="s" style="margin-bottom:8px">Signed in as ${esc((staff.names || {})[(me.email || "").toLowerCase()] || me.email)} (owner)</div><button class="btn alt" data-a="signout">Sign out</button></div>`;
}

const roleLabel = (e) => {
  const r = (staff.roles || {})[e] || "none",
    o = byId("outlets", (staff.outlets || {})[e]);
  return r === "cashier"
    ? "Cashier" + (o ? " · " + o.name : " · no bar set")
    : r === "manager"
      ? "Event center manager"
      : r;
};
