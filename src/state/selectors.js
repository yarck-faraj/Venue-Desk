import * as reports from "../domain/reports.js";
import {
  addDays,
  dayDiff,
  fmtDay,
  isoDay,
  isWkEnd,
  monthLabel as formatMonth,
  today,
} from "../domain/dates.js";
import * as receipts from "../domain/receipts.js";
import { isOwner, staff } from "./session.js";
import { createStayCalculations } from "../domain/stays.js";
import * as oldSales from "../domain/old-sales.js";
import { esc } from "../utils/dom.js";
import * as audit from "../domain/audit-log.js";
import * as pos from "../domain/pos.js";
import * as stock from "../domain/stock.js";
import { money as formatMoney, num } from "../domain/money.js";
import {
  OUTLET_TAGLINE,
  PALETTE,
  EXP_SEED,
  OUTLET_CODE,
  MONTHS,
  STAFF_DOMAIN,
  OLD_KIND,
} from "../config/constants.js";
import * as bookings from "../domain/bookings.js";
import * as crew from "../domain/crew.js";
import * as payments from "../domain/payments.js";
import { loginId as parseLogin } from "../domain/parse.js";
import { S, ui } from "./store.js";

export const cur = () => S.venue.currency || "GH₵";
/** @template {keyof import("./models.js").Collections} K @param {K} list @param {string | undefined} id @returns {import("./models.js").Collections[K][number] | undefined} */
export const byId = (list, id) =>
  /** @type {import("./models.js").Collections[K][number] | undefined} */ (S[list].find((x) => x.id === id));
/** @param {string} id */
export const spaceName = (id) => byId("spaces", id)?.name || "(removed space)";
/** @param {string} id */
export const spaceColor = (id) => {
  const i = S.spaces.findIndex((s) => s.id === id);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
};

/** @param {unknown} value */
export const money = (value) => formatMoney(value, cur());
/** @param {string} key */
export const monthLabel = (key) => formatMonth(key, MONTHS);
/** @param {unknown} value */
export const loginId = (value) => parseLogin(value, STAFF_DOMAIN);
/** @param {import("./models.js").Booking} b */
const crewPay = (b) => byId("crewPay", b.id)?.pay || {};
/** @param {import("./models.js").Booking} b @param {Parameters<typeof crew.crewPayOf>[1]} c */
export const crewPayOf = (b, c) => crew.crewPayOf(crewPay(b), c);
/** @param {import("./models.js").Booking} b */
export const crewTotal = (b) => crew.crewTotal(b, crewPay(b));
/** @param {import("./models.js").Booking} b */
export const crewText = (b) => crew.crewText(b, isOwner(), crewPay(b));
/** @param {string} id */
export const paidOf = (id) => payments.paidOf(id, S.payments);
/** @param {string} id */
export const chargesOf = (id) => bookings.chargesOf(id, S.sales);
/** @param {import("./models.js").Booking} b */
export const costOf = (b) => bookings.costOf(b, S.expenses, crewTotal(b));
/** @param {import("./models.js").Booking} b */
export const balanceOf = (b) => bookings.balanceOf(b, chargesOf(b.id), paidOf(b.id));
/** @param {Parameters<typeof bookings.conflicts>[0]} b */
export const conflicts = (b) => bookings.conflicts(b, S.bookings);
/** @param {import("./models.js").Payment} p */
export const payTitle = (p) =>
  payments.payTitle(
    p,
    OLD_KIND[String(p.legacyKind)],
    byId("stays", p.stayId)?.guestName,
    byId("bookings", p.bookingId)?.title,
  );

/** @param {string} id */
export const entName = (id) =>
  !id ? "Shared" : id === "center" ? "Event center" : byId("outlets", id)?.name || id;

/** @param {import("./models.js").Collections["stock"][number]} i */
export const stockLabel = (i) => entName(i.outletId) + " · " + i.name;

/** @param {string} sid */
export const stockCost = (sid) => num(byId("stockCosts", sid)?.cost); // cost per unit is kept in stockCosts/{stockId}, which only the owner can read

export const expCats = () => stock.expCats(S.expenseCategories, S.expenses, EXP_SEED);
/** @param {string} t */
export const stockByLabel = (t) => stock.stockByLabel(t, S.stock, stockLabel);

export const cartSub = () => pos.cartSub(ui.pos.cart);
export const cartTotal = () => pos.cartSub(ui.pos.cart);
/** @param {string} outlet @param {string} date */
export const nextReceiptNo = (outlet, date) => pos.nextReceiptNo(outlet, date, OUTLET_CODE, S.sales);
/** @param {import("./models.js").Shift} shift */
export const shiftStats = (shift) => pos.shiftStats(shift, S.sales, S.payments);

export const auditRange = () => audit.auditRange(ui.al, today());
export const auditFiltered = () => audit.auditFiltered(ui.al, S.audit);

/** @param {string} ent */
export const oldRows = (ent) =>
  oldSales.oldRows(
    ent,
    S.payments,
    ent === "center" ? [] : /** @type {import("./models.js").PaperSales} */ (ui.old).list[ent] || [],
    OLD_KIND,
  );
/** @param {import("./models.js").PaperStatus} status */
export const oldStatus = (status) => oldSales.oldStatus(status, (day) => esc(fmtDay(day)));

const stays = createStayCalculations({ addDays, dayDiff, isWkEnd });
export const {
  liveStay,
  effEnd,
  nightsOf,
  extrasOf,
  nightDays,
  nightlyOk,
  nightAmt,
  stayRoomTotal,
  stayPriced,
  roomWd,
  roomWe,
} = stays;
/** @param {import("./models.js").Room} room @param {boolean} [short] */
export const roomRateText = (room, short) => stays.roomRateText(room, !!short, money);
/** @param {import("./models.js").Stay} stay */
export const stayRoomLines = (stay) => stays.stayRoomLines(stay, money);
/** @param {string} id */
const stayPos = (id) => stays.stayPos(id, S.sales);
/** @param {string} id */
export const stayPaid = (id) => stays.stayPaid(id, S.payments);
/** @param {import("./models.js").Stay} stay */
export const stayTotal = (stay) => stays.stayTotal(stay, stayPos(stay.id));
/** @param {import("./models.js").Stay} stay */
export const stayBal = (stay) => stays.stayBal(stayTotal(stay), stayPaid(stay.id));
/** @param {import("./models.js").Stay} stay */
export const roomNames = (stay) => stays.roomNames(stay, S.rooms);
/** @param {Parameters<typeof stays.stayConflicts>[0]} stay */
export const stayConflicts = (stay) => stays.stayConflicts(stay, S.stays);
/** @param {import("./models.js").Room} room */
export const roomState = (room) => stays.roomState(room, S.stays, today());

/** @param {import("./models.js").Sale} s @param {number} [change] */
export const receiptData = (s, change) =>
  receipts.receiptData(
    s,
    byId("outlets", s.outletId),
    staff?.names || {},
    OUTLET_TAGLINE[s.outletId] || "",
    change,
  );

const periodRange = () => reports.periodRange(ui.period, today(), isoDay);
/** @param {string} from @param {string} to */
const cashIn = (from, to) => reports.cashIn(from, to, S.payments, S.sales);
export const overview = () =>
  reports.overview(S, periodRange(), { crewTotal, stockCost, isoDay, dayDiff, addDays, effEnd, nightAmt });
/** @param {string} period */
export const ownerHome = (period) => reports.ownerHome(S, period, today());
export function managerHome() {
  const day = today();
  return reports.managerHome(S, day, addDays(day, 14));
}
export const monthlyCash = () => reports.monthlyCash(S, isOwner(), crewTotal);
