/** @typedef {{id: string, status: string, guestName?:string, checkIn: string, checkOut: string, outDate?: string, roomIds?: string[], rate?: number, rateOverride?: number, nightly?: number[], extras?: {amount?: number}[], discount?: number}} Stay */
/** @typedef {{id: string, name?: string, status?: string, rate?: number, rateWeekday?: number, rateWeekend?: number}} Room */
/** @typedef {(amount: number | undefined) => string} FormatMoney */

/**
 * Bind calendar arithmetic once. Supply bookings, payments, and rates at each call.
 * @param {{addDays: (day: string, count: number) => string, dayDiff: (from: string, to: string) => number, isWkEnd: (day: string) => boolean}} calendar
 */
export function createStayCalculations({ addDays, dayDiff, isWkEnd }) {
  /** @param {Stay} s */
  const liveStay = (s) => s.status !== "cancelled" && s.status !== "noshow";

  /** @param {Stay} s */
  const effEnd = (s) =>
    s.status === "checkedout" && s.outDate && s.outDate < s.checkOut
      ? s.outDate > s.checkIn
        ? s.outDate
        : addDays(s.checkIn, 1)
      : s.checkOut;

  /** @param {Stay} s */
  const nightsOf = (s) => Math.max(1, dayDiff(s.checkIn, s.checkOut));

  /** @param {Stay} s */
  const extrasOf = (s) => (s.extras || []).reduce((a, e) => a + (Number(e.amount) || 0), 0);

  /** @param {Stay} s */
  const nightDays = (s) => Array.from({ length: nightsOf(s) }, (_, i) => addDays(s.checkIn, i));

  /** @param {Stay} s */
  const nightlyOk = (s) => Array.isArray(s.nightly) && s.nightly.length === nightsOf(s);

  /** @param {Stay} s @param {number} i */
  const nightAmt = (s, i) =>
    nightlyOk(s) ? Number(/** @type {number[]} */ (s.nightly)[i]) || 0 : Number(s.rate) || 0;

  /** @param {Stay} s */
  const stayRoomTotal = (s) =>
    nightlyOk(s)
      ? /** @type {number[]} */ (s.nightly).reduce((a, n) => a + (Number(n) || 0), 0)
      : nightsOf(s) * (Number(s.rate) || 0);

  /** @param {Stay} s */
  const stayPriced = (s) => s.rate !== undefined;

  /** @param {Room} r */
  const roomWd = (r) => Number(r.rateWeekday || r.rate) || 0;
  /** @param {Room} r */
  const roomWe = (r) => Number(r.rateWeekend || r.rateWeekday || r.rate) || 0;

  /** @param {Room} r @param {boolean} short @param {FormatMoney} money */
  const roomRateText = (r, short, money) => {
    const f = short ? /** @param {number | undefined} n */ (n) => (Number(n) || 0).toLocaleString() : money,
      a = roomWd(r),
      b = roomWe(r);
    return b !== a ? f(a) + " / " + f(b) : f(a);
  };

  /** @param {Stay} s @param {FormatMoney} money @returns {Array<[string,number]>} */
  function stayRoomLines(s, money) {
    // what to print on the guest bill for the room charge: [[description, amount], ...]
    const n = nightsOf(s);
    if (!stayPriced(s)) return [["Accommodation: price being calculated", 0]];
    if (!nightlyOk(s) || (Number(s.rateOverride) || 0) > 0)
      return [["Accommodation: " + n + " night(s) × " + money(s.rate), stayRoomTotal(s)]];
    let wd = 0,
      we = 0,
      wdA = 0,
      weA = 0;
    nightDays(s).forEach((d, i) => {
      if (isWkEnd(d)) {
        we++;
        weA += Number(/** @type {number[]} */ (s.nightly)[i]) || 0;
      } else {
        wd++;
        wdA += Number(/** @type {number[]} */ (s.nightly)[i]) || 0;
      }
    });
    return /** @type {Array<[string,number]>} */ (
      [
        wd && ["Accommodation: " + wd + " weekday night(s)", wdA],
        we && ["Accommodation: " + we + " weekend night(s)", weA],
      ].filter(Boolean)
    );
  }

  /** @param {string} id @param {Array<{stayId?: string,method?: string,status?: string,total?: number}>} sales */
  const stayPos = (id, sales) =>
    sales
      .filter((x) => x.stayId === id && x.method === "room" && x.status === "paid")
      .reduce((a, x) => a + (Number(x.total) || 0), 0);

  /** @param {Stay} s @param {number} roomCharges */
  const stayTotal = (s, roomCharges) =>
    stayRoomTotal(s) + extrasOf(s) + roomCharges - (Number(s.discount) || 0);

  /** @param {string} id @param {Array<{stayId?: string,type?: string,amount?: number}>} payments */
  const stayPaid = (id, payments) =>
    payments
      .filter((p) => p.stayId === id)
      .reduce((a, p) => a + (p.type === "refund" ? -(Number(p.amount) || 0) : Number(p.amount) || 0), 0);

  /** @param {number} total @param {number} paid */
  const stayBal = (total, paid) => total - paid;

  /** @param {Stay} s @param {Room[]} rooms */
  const roomNames = (s, rooms) =>
    (s.roomIds || []).map((r) => (rooms.find((room) => room.id === r) || { name: "?" }).name).join(", ");

  /** @param {Pick<Stay,"id"|"roomIds"|"checkIn"|"checkOut">} st @param {Stay[]} stays */
  const stayConflicts = (st, stays) =>
    stays.filter(
      (o) =>
        o.id !== st.id &&
        liveStay(o) &&
        (o.roomIds || []).some((r) => (st.roomIds || []).includes(r)) &&
        o.checkIn < st.checkOut &&
        st.checkIn < effEnd(o),
    );

  /** @param {Room} r @param {Stay[]} stays @param {string} t */
  function roomState(r, stays, t) {
    if (stays.some((s) => s.status === "checkedin" && (s.roomIds || []).includes(r.id))) return "occupied";
    if (r.status === "maintenance") return "maintenance";
    if (r.status === "dirty") return "dirty";
    if (
      stays.some(
        (s) => s.status === "reserved" && (s.roomIds || []).includes(r.id) && s.checkIn <= t && effEnd(s) > t,
      )
    )
      return "arriving";
    return "vacant";
  }
  return {
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
    roomRateText,
    stayRoomLines,
    stayPos,
    stayTotal,
    stayPaid,
    stayBal,
    roomNames,
    stayConflicts,
    roomState,
  };
}
