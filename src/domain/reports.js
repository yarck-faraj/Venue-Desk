/** @typedef {{id:string, start:string, end:string, status:string, crew?: Array<{name?:string,role?:string}>} & Record<string,any>} ReportBooking */
/** @typedef {{bookings: ReportBooking[], payments: Array<Record<string,any>>, sales: Array<Record<string,any>>, expenses: Array<Record<string,any>>, outlets: Array<Record<string,any>>, rooms: Array<Record<string,any>>, shifts: Array<Record<string,any>>, stays: Array<Record<string,any>>, stock: Array<Record<string,any>>}} ReportData */

/** @param {string} p @param {string} e @param {(date: Date) => string} isoDay @param {() => number} [now] */
export function periodRange(p, e, isoDay, now = Date.now) {
  return [
    p === "today"
      ? e
      : p === "week"
        ? isoDay(new Date(now() - 6 * 864e5))
        : p === "month"
          ? e.slice(0, 7) + "-01"
          : isoDay(new Date(now() - 89 * 864e5)),
    e,
  ];
}

/** @param {string} d @param {string[]} r */
export const inR = (d, r) => !!d && d >= r[0] && d <= r[1];

/** @param {string} s @param {string} e @param {Array<Record<string,any>>} payments @param {Array<Record<string,any>>} sales */
export function cashIn(s, e, payments, sales) {
  const r = [s, e];
  return (
    payments
      .filter((p) => inR(p.date, r))
      .reduce((a, p) => a + (p.type === "refund" ? -(Number(p.amount) || 0) : Number(p.amount) || 0), 0) +
    sales
      .filter(
        (x) =>
          x.status === "paid" &&
          x.method !== "booking" &&
          x.method !== "room" &&
          inR(x.paidDate || x.date, r),
      )
      .reduce((a, x) => a + (Number(x.total) || 0), 0)
  );
}

/** @param {ReportData} data @param {string} period @param {string} t */
export function ownerHome(data, period, t) {
  /** @param {string} d */
  const inP = (d) =>
    !!d &&
    (period === "today"
      ? d === t
      : period === "month"
        ? d.slice(0, 7) === t.slice(0, 7)
        : d.slice(0, 4) === t.slice(0, 4));
  const sales = data.sales.filter((x) => x.status === "paid" && inP(x.date)),
    pays = data.payments.filter((x) => inP(x.date)),
    exps = data.expenses.filter((x) => inP(x.date));
  /** @type {Array<{id: string, name: string, sub: string, inc: number, exp?: number}>} */
  const ent = [
    {
      id: "center",
      name: "Event center",
      sub: pays.length + " payment" + (pays.length === 1 ? "" : "s") + " received",
      inc: pays.reduce((a, x) => a + (x.type === "refund" ? -1 : 1) * (Number(x.amount) || 0), 0),
    },
    ...data.outlets.map((o) => {
      const ss = sales.filter((x) => x.outletId === o.id);
      return {
        id: o.id,
        name: o.name,
        sub: ss.length + " sale" + (ss.length === 1 ? "" : "s"),
        inc: ss.reduce((a, x) => a + (Number(x.total) || 0), 0),
      };
    }),
  ];
  ent.forEach((e) => {
    e.exp = exps.filter((x) => (x.entity || "") === e.id).reduce((a, x) => a + (Number(x.amount) || 0), 0);
  });
  const shared = exps.filter((x) => !x.entity).reduce((a, x) => a + (Number(x.amount) || 0), 0),
    inc = ent.reduce((a, e) => a + e.inc, 0),
    out = exps.reduce((a, x) => a + (Number(x.amount) || 0), 0);
  return { ent, shared, inc, out };
}

/** @param {ReportData} data @param {string} t @param {string} horizon */
export function managerHome(data, t, horizon) {
  const evs = data.bookings
    .filter((b) => b.status !== "cancelled")
    .filter((b) => (b.end || b.start).slice(0, 10) >= t && b.start.slice(0, 10) <= horizon)
    .sort((a, b) => a.start.localeCompare(b.start));
  const onToday = evs.filter((b) => b.start.slice(0, 10) <= t),
    arr = data.stays.filter((x) => x.status === "reserved" && x.checkIn <= t),
    dep = data.stays.filter((x) => x.status === "checkedin" && x.checkOut <= t),
    inn = data.stays.filter((x) => x.status === "checkedin");
  const rec = data.payments
    .filter((p) => (p.date || "").slice(0, 7) === t.slice(0, 7))
    .reduce((a, p) => a + (p.type === "refund" ? -1 : 1) * (Number(p.amount) || 0), 0);
  return { evs, onToday, arr, dep, inn, rec };
}

/** @param {ReportData} data @param {boolean} owner @param {(booking: ReportBooking) => number} crewTotal */
export function monthlyCash(data, owner, crewTotal) {
  /** @type {Record<string,{in:number,out:number}>} */
  const months = {};
  data.payments.forEach((p) => {
    const k = (p.date || "").slice(0, 7);
    if (k)
      (months[k] = months[k] || { in: 0, out: 0 }).in +=
        (p.type === "refund" ? -1 : 1) * (Number(p.amount) || 0);
  });
  if (owner)
    data.expenses.forEach((e) => {
      const k = (e.date || "").slice(0, 7);
      if (k) (months[k] = months[k] || { in: 0, out: 0 }).out += Number(e.amount) || 0;
    });
  /** @type {Record<string,number>} */
  const crewByMonth = {};
  if (owner)
    data.bookings
      .filter((b) => b.status !== "cancelled")
      .forEach((b) => {
        const k = b.start.slice(0, 7);
        const c = crewTotal(b);
        if (c) {
          months[k] = months[k] || { in: 0, out: 0 };
          crewByMonth[k] = (crewByMonth[k] || 0) + c;
        }
      });
  return { months, crewByMonth };
}

/** @param {ReportData} data @param {string[]} r @param {Record<string,Function>} helpers @param {() => number} [now] */
export function overview(data, r, helpers, now = Date.now) {
  const { crewTotal, stockCost, isoDay, dayDiff, addDays, effEnd, nightAmt } = helpers;
  const paid = data.sales.filter((s) => s.status === "paid" && inR(s.paidDate || s.date, r));
  const payIn = data.payments
    .filter((p) => inR(p.date, r))
    .reduce((a, p) => a + (p.type === "refund" ? -(Number(p.amount) || 0) : Number(p.amount) || 0), 0);
  const posCash = paid
      .filter((s) => s.method !== "booking" && s.method !== "room")
      .reduce((a, s) => a + (Number(s.total) || 0), 0),
    charged = paid
      .filter((s) => s.method === "booking" || s.method === "room")
      .reduce((a, s) => a + (Number(s.total) || 0), 0);
  const exp = data.expenses.filter((e) => inR(e.date, r)).reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const crew = data.bookings
    .filter((b) => b.status !== "cancelled" && inR(b.start.slice(0, 10), r))
    .reduce((a, b) => a + crewTotal(b), 0);
  const cin = payIn + posCash,
    profit = cin - exp - crew,
    oldAmt =
      paid.filter((s) => s.legacy).reduce((a, s) => a + (Number(s.total) || 0), 0) +
      data.payments
        .filter((p) => p.legacy && inR(p.date, r))
        .reduce((a, p) => a + (Number(p.amount) || 0), 0);
  /** @type {Record<string,{rev:number,cost:number}>} */
  const byOut = {};
  /** @type {Record<string,{q:number,rev:number}>} */
  const prod = {};
  /** @type {Record<string,number>} */
  const byM = {};
  /** @type {Record<string,{n:number,t:number}>} */
  const byS = {};
  paid.forEach((s) => {
    s.items.forEach(
      (
        /** @type {{outletId:string, qty:number,price:number,stockId?:string,per?:number,lump?:boolean,name:string}} */ i,
      ) => {
        const o = (byOut[i.outletId] = byOut[i.outletId] || { rev: 0, cost: 0 });
        o.rev += i.qty * i.price;
        o.cost += i.stockId ? i.qty * (i.per || 1) * stockCost(i.stockId) : 0;
        if (!i.lump) {
          const p = (prod[i.name] = prod[i.name] || { q: 0, rev: 0 });
          p.q += i.qty;
          p.rev += i.qty * i.price;
        }
      },
    );
    byM[s.method] = (byM[s.method] || 0) + (Number(s.total) || 0);
    const sk = s.legacy ? "paper records (old sales)" : s.staff,
      u = (byS[sk] = byS[sk] || { n: 0, t: 0 });
    u.n++;
    u.t += Number(s.total) || 0;
  });
  const disc = paid.reduce((a, s) => a + (Number(s.discount) || 0), 0),
    voids = data.sales.filter((s) => s.status === "void" && inR(s.date, r));
  const odd = data.shifts.filter(
    (s) => s.closedAt && inR(s.date, r) && Math.abs(Number(s.diff) || 0) > 0.005,
  );
  const low = data.stock.filter((i) => (Number(i.qty) || 0) <= (Number(i.low) || 0)),
    sval = data.stock.reduce((a, i) => a + Math.max(0, Number(i.qty) || 0) * stockCost(i.id), 0);
  const days = Array.from({ length: 14 }, (_, n) => isoDay(new Date(now() - (13 - n) * 864e5))),
    vals = days.map((d) => cashIn(d, d, data.payments, data.sales)),
    mx = Math.max(1, ...vals);
  const evs = data.bookings.filter((b) => b.status !== "cancelled" && inR(b.start.slice(0, 10), r));
  const nDays = dayDiff(r[0], r[1]) + 1;
  let roomNights = 0,
    roomRev = 0,
    stayN = 0;
  data.stays
    .filter((s) => s.status !== "cancelled" && s.status !== "noshow")
    .forEach((st) => {
      const a = st.checkIn > r[0] ? st.checkIn : r[0],
        last = addDays(effEnd(st), -1),
        z = last < r[1] ? last : r[1],
        n = dayDiff(a, z) + 1;
      if (n > 0) {
        roomNights += n * st.roomIds.length;
        for (let i = 0; i < n; i++) roomRev += nightAmt(st, dayDiff(st.checkIn, addDays(a, i)));
        stayN++;
      }
    });
  const occPct = data.rooms.length ? Math.round((roomNights / (data.rooms.length * nDays)) * 100) : 0;
  return {
    r,
    payIn,
    posCash,
    charged,
    exp,
    crew,
    cin,
    profit,
    oldAmt,
    byOut,
    prod,
    byM,
    byS,
    disc,
    voids,
    odd,
    low,
    sval,
    days,
    vals,
    mx,
    evs,
    nDays,
    roomNights,
    roomRev,
    stayN,
    occPct,
  };
}
