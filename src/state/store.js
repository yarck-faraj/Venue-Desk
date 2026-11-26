import { today } from "../domain/dates.js";

/** @type {import("./models.js").Store} */
export const S = {
  bookings: [],
  clients: [],
  vendors: [],
  spaces: [],
  payments: [],
  expenses: [],
  outlets: [],
  products: [],
  stock: [],
  sales: [],
  shifts: [],
  rooms: [],
  stays: [],
  audit: [],
  stockCosts: [],
  crewPay: [],
  expenseCategories: [],
  venue: {},
  oldSales: {},
};
/** @type {import("./models.js").UIState} */
export const ui = {
  tab: "home",
  month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  day: today(),
  spaceFilter: "",
  money: "payments",
  bookFilter: "upcoming",
  q: "",
  sub: "",
  detail: null,
  stayDetail: null,
  stayMode: "board",
  stayStart: today(),
  stayFilter: "inhouse",
  sq: "",
  peopleTab: "clients",
  period: "month",
  rc: null,
  al: { range: "7", from: "", to: "", staff: "", action: "", q: "" },
  alLoading: false,
  alCapped: false,
  pos: { outlet: "", cat: "", cart: [], q: "" },
};

ui.old = { st: {}, list: {}, busy: {}, err: {}, ent: "" };
