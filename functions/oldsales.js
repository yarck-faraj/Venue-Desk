// Pure logic for logging OLD sales (the ones written on paper before the app took over).
// No Firebase imports, so it can be tested with plain Node.
//
// The rule: old sales can only be logged for days BEFORE the cut-off date.
//   cut-off = the date the owner typed in (More > Old sales), otherwise
//             the first day the app was used for real (first till day / first payment), otherwise
//             today (the app has not been used yet, so only days before today can be logged).
// From the cut-off day on, every sale comes from the app.

const EARLIEST = "2015-01-01";                      // anything older is almost certainly a typing slip
const BAR_METHODS = ["cash", "momo", "card"];
const CENTER_METHODS = ["cash", "momo", "bank", "card", "cheque"];
const CENTER_KINDS = ["hall", "room", "other"];
const OUTLET_CODE = { coffee: "GB", cocktail: "CT", bites: "BT" };
const MAX_ENTRIES = 40;

const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s;
const addDays = (s, n) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const todayUTC = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);     // Ghana is on UTC all year
const dayNoon = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d, 12); };

// a money value: a number or numeric text; blank/undefined counts as 0; anything else is NaN (invalid)
const amt = v => {
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return 0;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};
const txt = (v, n) => String(v === undefined || v === null ? "" : v).replace(/\s+/g, " ").trim().slice(0, n);

function pickCutoff({ manual, auto, today }) {
  const m = typeof manual === "string" ? manual.slice(0, 10) : "";
  if (isDay(m)) return { date: m, source: "owner", auto: auto || "" };
  if (auto) return { date: auto, source: "first-day", auto };
  return { date: today, source: "today", auto: "" };
}

function checkDate(date, cutoff) {
  if (!isDay(date)) return "That date is not valid.";
  if (date < EARLIEST) return "That date is too far back. Check the year.";
  if (date >= cutoff) return "Old sales can only be logged for days before " + cutoff + ". From that day on, sales come from the app.";
  return "";
}

function saleDoc(ctx, date, method, items, note) {
  const total = Math.round(items.reduce((a, i) => a + i.qty * i.price, 0) * 100) / 100, ts = dayNoon(date);
  return {
    no: "OLD-" + ctx.code + "-" + date.slice(2, 4) + date.slice(5, 7) + date.slice(8, 10) + "-" + ctx.rand(),
    items, subtotal: total, discount: 0, total, method, status: "paid",
    legacy: true, source: "paper", note,
    date, paidDate: date, ts, paidAt: ts, tendered: 0,
    shiftId: "", payShiftId: "",                    // never part of a till shift, so it cannot disturb a cash count
    staff: ctx.who, outletId: ctx.entity, loggedBy: ctx.who, loggedAt: ctx.now, updatedAt: ctx.now, updatedBy: ctx.who
  };
}

// One entry typed by a cashier (or the owner) for a bar. Returns { docs } or { error }.
//   { kind: "total", date, cash, momo, card, note }     a whole day's takings, one amount per payment method
//   { kind: "sale",  date, method, items: [{name, qty, price}], note }
function barDocs(entry, ctx) {
  if (!entry || typeof entry !== "object") return { error: "Empty entry." };
  const e = checkDate(String(entry.date || ""), ctx.cutoff); if (e) return { error: e, late: /before/.test(e) };
  const date = entry.date, note = txt(entry.note, 200);
  if (entry.kind === "total") {
    const docs = [];
    for (const m of BAR_METHODS) {
      const v = amt(entry[m]);
      if (Number.isNaN(v) || v < 0 || v >= 1e8) return { error: "Check the " + m + " amount." };
      if (v > 0) docs.push(saleDoc(ctx, date, m, [{ name: "Day total (paper records)", qty: 1, price: v, outletId: ctx.entity, lump: true }], note));
    }
    return docs.length ? { docs } : { error: "Enter at least one amount." };
  }
  if (entry.kind === "sale") {
    if (!BAR_METHODS.includes(entry.method)) return { error: "Choose how it was paid." };
    if (!Array.isArray(entry.items) || !entry.items.length) return { error: "Add at least one item." };
    if (entry.items.length > 50) return { error: "Too many items on one sale (50 at most)." };
    const items = [];
    for (const i of entry.items) {
      const name = txt(i && i.name, 80), qty = amt(i && i.qty), price = amt(i && i.price);
      if (!name) return { error: "Every item needs a name." };
      if (!(qty > 0) || qty > 10000) return { error: "Check the quantity of " + name + "." };
      if (Number.isNaN(price) || price < 0 || price > 1e6) return { error: "Check the price of " + name + "." };
      items.push({ name, qty, price, outletId: ctx.entity });
    }
    const doc = saleDoc(ctx, date, entry.method, items, note);
    return doc.total > 0 && doc.total < 1e8 ? { docs: [doc] } : { error: "The total must be more than zero." };
  }
  return { error: "Unknown kind of entry." };
}

// One entry for the event center: money received for a hall/event, a room stay or something else.
//   { kind: "center", date, amount, method, what: "hall"|"room"|"other", name, note }
function centerDocs(entry, ctx) {
  if (!entry || typeof entry !== "object" || entry.kind !== "center") return { error: "Unknown kind of entry." };
  const e = checkDate(String(entry.date || ""), ctx.cutoff); if (e) return { error: e, late: /before/.test(e) };
  const amount = amt(entry.amount), what = entry.what || "other", method = entry.method || "cash";
  if (Number.isNaN(amount) || !(amount > 0) || amount >= 1e8) return { error: "Enter the amount received." };
  if (!CENTER_METHODS.includes(method)) return { error: "Choose how it was paid." };
  if (!CENTER_KINDS.includes(what)) return { error: "Choose what the payment was for." };
  return { docs: [{
    type: "payment", amount, date: entry.date, method, note: txt(entry.note, 200),
    legacy: true, source: "paper", legacyKind: what, legacyName: txt(entry.name, 80),
    bookingId: "", stayId: "", shiftId: "",
    loggedBy: ctx.who, loggedAt: ctx.now, updatedAt: ctx.now, updatedBy: ctx.who
  }] };
}

module.exports = { EARLIEST, BAR_METHODS, CENTER_METHODS, CENTER_KINDS, OUTLET_CODE, MAX_ENTRIES, isDay, addDays, todayUTC, pickCutoff, checkDate, barDocs, centerDocs, amt };
