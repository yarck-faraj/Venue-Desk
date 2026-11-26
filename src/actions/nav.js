import { ui } from "../state/store.js";
import { render } from "../app/render.js";
import { oldLoad } from "../firebase/callables.js";
import { addDays, p2, today } from "../domain/dates.js";
import { myOutlet } from "../state/session.js";
import { closeModal } from "../components/modal.js";
import { closeSheet } from "./sheet.js";
import { loadAudit } from "../firebase/audit.js";

export const navActions = {
  tab: (d) => {
    ui.tab = d.k;
    ui.sub = "";
    ui.detail = null;
    render();
    scrollTo(0, 0);
    if (d.k === "old") oldLoad("center");
  },
  goBook: (d) => {
    ui.tab = "book";
    ui.detail = d.id;
    ui.stayDetail = null;
    render();
  },
  goStay: (d) => {
    ui.tab = "stay";
    ui.stayDetail = d.id;
    ui.detail = null;
    render();
  },
  ohPer: (d) => {
    ui.oh.per = d.k;
    render();
  },
  exPer: (d) => {
    ui.ex.per = d.k;
    render();
  },
  exCat: (d) => {
    ui.ex.cat = d.k;
    render();
  },
  exEnt: (d) => {
    ui.ex.ent = d.k;
    render();
  },
  exNav: (d) => {
    const E = ui.ex,
      [y, m] = E.ym.split("-").map(Number),
      n = new Date(y, m - 1 + +d.k * (E.per === "year" ? 12 : 1), 1);
    E.ym = n.getFullYear() + "-" + p2(n.getMonth() + 1);
    render();
  },
  cxMode: (d) => {
    ui.cx = d.k;
    render();
    if (d.k === "old") oldLoad(myOutlet());
  },
  closeModal,
  closeSheet,
  closeSheetBg: (d, el, ev) => {
    if (ev.target === el) closeSheet();
  },
  open: (d) => {
    ui.detail = d.id;
    ui.stayDetail = null;
    render();
  },
  day: (d) => {
    ui.day = d.day;
    render();
  },
  prevMonth: () => {
    ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() - 1, 1);
    render();
  },
  nextMonth: () => {
    ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() + 1, 1);
    render();
  },
  thisMonth: () => {
    const n = new Date();
    ui.month = new Date(n.getFullYear(), n.getMonth(), 1);
    ui.day = today();
    render();
  },
  bookFilter: (d) => {
    ui.bookFilter = d.k;
    render();
  },
  moneyTab: (d) => {
    ui.money = d.k;
    render();
  },
  peopleTab: (d) => {
    ui.peopleTab = d.k;
    render();
  },
  sub: (d) => {
    ui.sub = d.k;
    if (d.k === "audit") loadAudit();
    else if (d.k === "oldsales") {
      ui.old.ent = ui.old.ent || "center";
      render();
      oldLoad(ui.old.ent);
    } else render();
  },
  posCat: (d) => {
    ui.pos.cat = d.k;
    render();
  },
  goStock: () => {
    ui.tab = "more";
    ui.sub = "stock";
    ui.detail = null;
    render();
    scrollTo(0, 0);
  },
  period: (d) => {
    ui.period = d.k;
    render();
  },
  openStay: (d) => {
    ui.stayDetail = d.id;
    ui.detail = null;
    render();
  },
  stayMode: (d) => {
    ui.stayMode = d.k;
    render();
  },
  stayFilter: (d) => {
    ui.stayFilter = d.k;
    render();
  },
  stayPrev: () => {
    ui.stayStart = addDays(ui.stayStart, -7);
    render();
  },
  stayNext: () => {
    ui.stayStart = addDays(ui.stayStart, 7);
    render();
  },
  stayToday: () => {
    ui.stayStart = today();
    render();
  },
  alRange: (d) => {
    ui.al.range = d.k;
    if (d.k !== "custom") loadAudit();
    else render();
  },
  oldEnt: (d) => {
    ui.old.ent = d.ent;
    render();
    oldLoad(d.ent);
  },
};
