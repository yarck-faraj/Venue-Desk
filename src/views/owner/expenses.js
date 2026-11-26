import { S, ui } from "../../state/store.js";
import { fmtDay, today } from "../../domain/dates.js";
import { num } from "../../domain/money.js";
import { MONTHS } from "../../config/constants.js";
import { filterButtons, moneySeg } from "../../components/seg.js";
import { chips } from "../../components/chips.js";
import { esc } from "../../utils/dom.js";
import { entName, money } from "../../state/selectors.js";

export function vExpenses() {
  const E = (ui.ex = ui.ex || { per: "month", ym: today().slice(0, 7), cat: "", ent: "" });
  const inPer = (e) => {
    const d = e.date || "";
    return (
      E.per === "all" || (E.per === "year" ? d.slice(0, 4) === E.ym.slice(0, 4) : d.slice(0, 7) === E.ym)
    );
  };
  const base = S.expenses.filter(
    (e) => inPer(e) && (!E.ent || (e.entity || "") === (E.ent === "shared" ? "" : E.ent)),
  );
  const byCat = {};
  base.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + num(e.amount)));
  const list = base
    .filter((e) => !E.cat || e.category === E.cat)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const total = list.reduce((a, e) => a + num(e.amount), 0),
    all = Object.values(byCat).reduce((a, v) => a + v, 0) || 1;
  const label =
    E.per === "month"
      ? MONTHS[+E.ym.slice(5) - 1] + " " + E.ym.slice(0, 4)
      : E.per === "year"
        ? E.ym.slice(0, 4)
        : "All time";
  const ents = [
    ["", "Everything"],
    ["shared", "Shared"],
    ["center", "Event center"],
    ...S.outlets.map((o) => [o.id, o.name]),
  ];
  const mons = {};
  list.forEach((e) => {
    const k = (e.date || "").slice(0, 7);
    if (k) mons[k] = (mons[k] || 0) + num(e.amount);
  });
  return `<div class="bar"><div class="seg">${moneySeg()}<button data-a="moneyTab" data-k="payments">Payments in</button><button class="on" data-a="moneyTab" data-k="expenses">Expenses out</button></div><span class="grow"></span><button class="btn gold sm" data-a="newExpense">+ Add expense</button></div>
  <div class="bar"><div class="seg">${filterButtons(
    [
      ["month", "Month"],
      ["year", "Year"],
      ["all", "All"],
    ],
    E.per,
    "exPer",
  )}</div>${E.per !== "all" ? `<button class="btn alt sm" data-a="exNav" data-k="-1">‹</button><b>${label}</b><button class="btn alt sm" data-a="exNav" data-k="1">›</button>` : ""}</div>
  ${chips(ents.map(([k, l]) => `<button class="${E.ent === k ? "on" : ""}" data-a="exEnt" data-k="${k}">${esc(l)}</button>`).join(""))}
  <div class="card"><h2>${esc(E.cat || "All expenses")} <span>${money(total)}</span></h2>${E.cat ? '<button class="btn alt sm" data-a="exCat" data-k="">Show all categories</button>' : ""}</div>
  <div class="card"><h2>By category</h2>${
    Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([c, v]) =>
          `<div class="row tap" data-a="exCat" data-k="${esc(c)}"><div class="grow t">${esc(c)}${E.cat === c ? " ✓" : ""}</div><div class="s">${Math.round((v / all) * 100)}%</div><div class="amt">${money(v)}</div></div>`,
      )
      .join("") || '<div class="empty">No expenses in this period.</div>'
  }</div>
  ${
    E.per !== "month" && Object.keys(mons).length
      ? `<div class="card"><h2>By month</h2>${Object.keys(mons)
          .sort()
          .reverse()
          .map(
            (k) =>
              `<div class="row"><div class="grow t">${MONTHS[+k.slice(5) - 1]} ${k.slice(0, 4)}</div><div class="amt">${money(mons[k])}</div></div>`,
          )
          .join("")}</div>`
      : ""
  }
  <div class="card"><h2>Entries</h2>${list.map((e) => `<div class="row tap" data-a="editExpense" data-id="${e.id}"><div class="grow"><div class="t">${esc(e.category)}${e.note ? " · " + esc(e.note) : ""}</div><div class="s">${e.date ? esc(fmtDay(e.date)) + " · " : ""}${esc(entName(e.entity))}</div></div><div class="amt neg">${money(e.amount)}</div></div>`).join("") || '<div class="empty">Nothing recorded.</div>'}</div>`;
}
