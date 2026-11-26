// Server-side pricing. Prices are written here with admin rights, so no signed-in user,
// however skilled, can set a booking price or a stay rate from the app or the console API.
// Only the owner can give an override (priceOverride / rateOverride); everyone else's writes
// to price, rate, nightly, discount or the override fields are refused by firestore.rules.
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { num, DAY, bookingPrice, stayNightly } = require("./pricing");
const OLD = require("./oldsales");

const REGION = "europe-west1";   // set this to your Firestore location (Firebase console > Firestore > Data)

initializeApp();
const db = getFirestore();

exports.priceBooking = onDocumentWritten({ document: "bookings/{id}", region: REGION }, async ev => {
  const after = ev.data.after; if (!after.exists) return;
  const b = after.data(), was = ev.data.before.exists ? ev.data.before.data() : null;
  const inputs = x => JSON.stringify([x.spaceIds || [], x.start, x.end, num(x.priceOverride)]);
  if (was && inputs(was) === inputs(b) && b.price !== undefined) return;      // unrelated edit: keep the agreed price
  let price = num(b.priceOverride), auto = false;
  if (!(price > 0)) {
    const docs = await Promise.all((b.spaceIds || []).map(id => db.doc("spaces/" + id).get()));
    price = bookingPrice(docs.filter(d => d.exists).map(d => d.data()), b.start || "", b.end || b.start || ""); auto = true;
  }
  if (b.price === price && b.priceAuto === auto) return;
  await after.ref.update({ price, priceAuto: auto, pricedAt: Date.now() });
});

// A stay is priced night by night: each room at its weekday or weekend rate for that night.
// Writes `nightly` (the amount for each night, all rooms together) and `rate` (the average per night).
exports.priceStay = onDocumentWritten({ document: "stays/{id}", region: REGION }, async ev => {
  const after = ev.data.after; if (!after.exists) return;
  const s = after.data(), was = ev.data.before.exists ? ev.data.before.data() : null;
  const inputs = x => JSON.stringify([x.roomIds || [], x.checkIn, x.checkOut, num(x.rateOverride)]);
  if (was && inputs(was) === inputs(s) && s.rate !== undefined) return;       // unrelated edit: keep the agreed price
  if (!DAY.test(s.checkIn || "") || !DAY.test(s.checkOut || "")) return;
  const override = num(s.rateOverride);
  let rooms = [];
  if (!(override > 0)) {
    const docs = await Promise.all((s.roomIds || []).map(id => db.doc("rooms/" + id).get()));
    rooms = docs.filter(d => d.exists).map(d => d.data());
  }
  const nightly = stayNightly(rooms, s.checkIn, s.checkOut, override);
  const rate = Math.round(nightly.reduce((a, n) => a + n, 0) / nightly.length * 100) / 100;
  if (s.rate === rate && JSON.stringify(s.nightly || null) === JSON.stringify(nightly)) return;
  await after.ref.update({ rate, nightly, pricedAt: Date.now() });
});

// Password reset for staff who sign in by name (accounts like ama@staff.lynns.invalid have no real
// mailbox, so the usual "email me a reset link" cannot work). Only the owner may call this, and only
// for accounts that are on the staff list and end in @staff.lynns.invalid.
const STAFF_DOMAIN = "@staff.lynns.invalid";
exports.resetStaffPassword = onCall({ region: REGION }, async req => {
  const caller = req.auth && req.auth.token && req.auth.token.email ? String(req.auth.token.email).toLowerCase() : "";
  if (!caller) throw new HttpsError("unauthenticated", "Sign in first.");
  const snap = await db.doc("settings/staff").get(), st = snap.exists ? snap.data() : {};
  if (!st.ownerEmail || String(st.ownerEmail).toLowerCase() !== caller) throw new HttpsError("permission-denied", "Only the owner can reset a password.");
  const email = String((req.data || {}).email || "").toLowerCase(), password = String((req.data || {}).password || "");
  if (!email.endsWith(STAFF_DOMAIN)) throw new HttpsError("invalid-argument", "Only name-login staff accounts can be reset here.");
  if (!(st.emails || []).map(x => String(x).toLowerCase()).includes(email)) throw new HttpsError("not-found", "That person is not on the staff list.");
  if (password.length < 6 || password.length > 128) throw new HttpsError("invalid-argument", "The password needs at least 6 characters.");
  const auth = getAuth();
  let user;
  try { user = await auth.getUserByEmail(email); } catch (e) { throw new HttpsError("not-found", "No login exists for that person yet."); }
  await auth.updateUser(user.uid, { password });
  await auth.revokeRefreshTokens(user.uid);           // signs them out everywhere; they log in again with the new password
  await db.collection("audit").add({ action: "staff", detail: "Password reset for " + email, by: caller, ts: Date.now(), date: new Date().toISOString().slice(0, 10), expireAt: new Date(Date.now() + 730 * 864e5) });
  return { ok: true };
});


// ---------------------------------------------------------------------------------------------
// Old (paper) sales. Cashiers, the manager and the owner log sales made BEFORE the app took over.
// Everything is checked and written here with admin rights, and firestore.rules refuses any direct
// write of a `legacy` record from a cashier or manager, so the cut-off date cannot be bypassed:
// a logged day must be before the cut-off (the owner's date, else the first day the app was used).
// ---------------------------------------------------------------------------------------------
async function oldFirstActivity(entity) {
  const dates = [];
  if (entity === "center") {            // first real payment recorded in the app
    (await db.collection("payments").select("date", "legacy").get()).forEach(d => { const x = d.data(); if (!x.legacy && OLD.isDay(String(x.date || "").slice(0, 10))) dates.push(String(x.date).slice(0, 10)); });
  } else {                              // first day a till was started for this bar
    (await db.collection("shifts").where("outletId", "==", entity).select("date").get()).forEach(d => { const x = d.data(); if (OLD.isDay(String(x.date || "").slice(0, 10))) dates.push(String(x.date).slice(0, 10)); });
  }
  return dates.sort()[0] || "";
}
async function oldCutoff(entity) {
  const [cfg, auto] = await Promise.all([db.doc("settings/oldSales").get(), oldFirstActivity(entity)]);
  const manual = cfg.exists ? ((cfg.data().cutoff || {})[entity] || "") : "";
  return OLD.pickCutoff({ manual, auto, today: OLD.todayUTC() });
}
exports.oldSales = onCall({ region: REGION }, async req => {
  const caller = req.auth && req.auth.token && req.auth.token.email ? String(req.auth.token.email).toLowerCase() : "";
  if (!caller) throw new HttpsError("unauthenticated", "Sign in first.");
  const st = (await db.doc("settings/staff").get()).data() || {}, lc = x => String(x || "").toLowerCase();
  if (!(st.emails || []).map(lc).includes(caller)) throw new HttpsError("permission-denied", "You are not on the staff list.");
  const owner = lc(st.ownerEmail) === caller, role = owner ? "owner" : (st.roles || {})[caller], myOutlet = (st.outlets || {})[caller] || "";
  const d = req.data || {}, entity = String(d.entity || "");
  if (entity === "center") { if (!(owner || role === "manager")) throw new HttpsError("permission-denied", "Only the manager or the owner can log old event center sales."); }
  else {
    if (!entity || !(await db.doc("outlets/" + entity).get()).exists) throw new HttpsError("not-found", "That bar does not exist.");
    if (!(owner || (role === "cashier" && myOutlet === entity))) throw new HttpsError("permission-denied", "You can only log old sales for your own bar.");
  }
  const cut = await oldCutoff(entity);
  if (d.action === "status") return { cutoff: cut.date, source: cut.source, auto: cut.auto, lastDay: OLD.addDays(cut.date, -1) };
  if (d.action !== "log") throw new HttpsError("invalid-argument", "Unknown action.");
  const entries = Array.isArray(d.entries) ? d.entries : [];
  if (!entries.length || entries.length > OLD.MAX_ENTRIES) throw new HttpsError("invalid-argument", "Send between 1 and " + OLD.MAX_ENTRIES + " entries at a time.");
  const now = Date.now(), rand = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  const ctx = { entity, code: OLD.OUTLET_CODE[entity] || String(entity).replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase().padEnd(2, "X"), who: caller, now, cutoff: cut.date, rand };
  const docs = [];
  for (const e of entries) {
    const r = entity === "center" ? OLD.centerDocs(e, ctx) : OLD.barDocs(e, ctx);
    if (r.error) throw new HttpsError(r.late ? "failed-precondition" : "invalid-argument", r.error);
    docs.push(...r.docs);
  }
  const coll = entity === "center" ? "payments" : "sales", batch = db.batch();
  docs.forEach(x => batch.set(db.collection(coll).doc(), x));
  const total = Math.round(docs.reduce((a, x) => a + (entity === "center" ? x.amount : x.total), 0) * 100) / 100, dates = docs.map(x => x.date).sort();
  batch.set(db.collection("audit").doc(), { action: "old sales", detail: ("Logged " + docs.length + " record(s) for " + entity + ", total " + total + ", dates " + dates[0] + (dates[0] === dates[dates.length - 1] ? "" : " to " + dates[dates.length - 1])).slice(0, 300), by: caller, ts: now, date: OLD.todayUTC(now), expireAt: new Date(now + 730 * 864e5) });
  await batch.commit();
  return { saved: docs.length, total, cutoff: cut.date };
});
