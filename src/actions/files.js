import { S } from "../state/store.js";
import {
  balanceOf,
  byId,
  costOf,
  nightsOf,
  oldRows,
  paidOf,
  payTitle,
  roomNames,
  spaceName,
  stayBal,
  stayPaid,
  stayRoomTotal,
  stayTotal,
} from "../state/selectors.js";
import { csvText } from "../domain/csv.js";
import { today } from "../domain/dates.js";
import { toast } from "../components/toast.js";
import { importProducts } from "../firebase/writes.js";
import { audit } from "../firebase/audit.js";
import { OLD_METHODS } from "../config/constants.js";

export function csv(kind) {
  let rows;
  if (kind === "bookings")
    rows = [
      ["Event", "Client", "Halls", "Start", "End", "Status", "Guests", "Price", "Paid", "Balance", "Costs"],
      ...S.bookings.map((b) => [
        b.title,
        b.clientName,
        (b.spaceIds || []).map(spaceName).join(" + "),
        b.start,
        b.end,
        b.status,
        b.guests,
        b.price,
        paidOf(b.id),
        balanceOf(b),
        costOf(b),
      ]),
    ];
  else if (kind === "sales")
    rows = [
      [
        "Receipt",
        "Date",
        "Time",
        "Outlet items",
        "Method",
        "Status",
        "Discount",
        "Total",
        "Staff",
        "Table/customer",
        "Event",
        "Source",
      ],
      ...S.sales.map((x) => [
        x.no,
        x.date,
        new Date(x.ts).toLocaleTimeString(),
        x.items.map((i) => i.qty + " " + i.name).join("; "),
        x.method,
        x.status,
        x.discount,
        x.total,
        x.staff,
        x.label,
        x.bookingTitle,
        x.legacy ? "Paper records" : "App",
      ]),
    ];
  else if (kind === "stays")
    rows = [
      [
        "Guest",
        "Phone",
        "Rooms",
        "Check-in",
        "Check-out",
        "Nights",
        "Status",
        "Avg rate/night",
        "Room charge",
        "Total",
        "Paid",
        "Balance",
      ],
      ...S.stays.map((x) => [
        x.guestName,
        x.phone,
        roomNames(x),
        x.checkIn,
        x.checkOut,
        nightsOf(x),
        x.status,
        x.rate,
        stayRoomTotal(x),
        stayTotal(x),
        stayPaid(x.id),
        stayBal(x),
      ]),
    ];
  else if (kind === "payments")
    rows = [
      ["Date", "Event", "Type", "Amount", "Method", "Note"],
      ...S.payments.map((p) => [p.date, payTitle(p), p.type, p.amount, p.method, p.note]),
    ];
  else
    rows = [
      ["Date", "Category", "Description", "Amount", "Vendor", "Event"],
      ...S.expenses.map((e) => [
        e.date,
        e.category,
        e.note,
        e.amount,
        (byId("vendors", e.vendorId) || {}).name,
        byId("bookings", e.bookingId)?.title,
      ]),
    ];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csvText(rows)], { type: "text/csv" }));
  a.download = kind + "-" + today() + ".csv";
  a.click();
}

/* ---------- editors: POS data ---------- */
export async function readMenu(f) {
  if (!f) return;
  try {
    const d = JSON.parse(await f.text()),
      out = byId("outlets", d.outlet);
    if (!out) return toast("Add the three outlets first (More > Outlets)");
    const have = new Set(S.products.map((x) => x.outletId + "|" + (x.sku || x.name.toLowerCase())));
    const title = (c) =>
      String(c || "Other")
        .toLowerCase()
        .replace(/(^|[\s—-])\w/g, (m) => m.toUpperCase());
    const items = (d.products || [])
      .filter((x) => !have.has(d.outlet + "|" + (x.sku || x.name.toLowerCase())))
      .slice(0, 450);
    if (!items.length) return toast("Everything in this file is already there");
    if (!confirm("Add " + items.length + " items to " + out.name + "?")) return;
    await importProducts(items, d.outlet, title);
    audit("import", items.length + " products into " + out.name);
    toast("Added " + items.length + " items to " + out.name);
  } catch (e) {
    toast("Could not import: " + e.message);
  }
}

export function oldCsv(ent) {
  const rows = [
    ["Date", "Paid by", "Details", "Amount", "Logged by"],
    ...oldRows(ent)
      .slice()
      .reverse()
      .map((r) => [r.date, OLD_METHODS[r.method] || r.method, r.desc, r.amount, r.by]),
  ];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csvText(rows)], { type: "text/csv" }));
  a.download = "old-sales-" + ent + "-" + today() + ".csv";
  a.click();
}
