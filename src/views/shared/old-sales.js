import { esc } from "../../utils/dom.js";
import { isOwner, staff } from "../../state/session.js";
import { S, ui } from "../../state/store.js";
import { entName, money, monthLabel, oldRows, oldStatus } from "../../state/selectors.js";
import { oldSum } from "../../domain/old-sales.js";
import { fmtDay } from "../../domain/dates.js";
import { OLD_METHODS } from "../../config/constants.js";
import { chips } from "../../components/chips.js";

const oldWho = (r) => (r.by ? " · logged by " + esc((staff.names || {})[r.by] || r.by.split("@")[0]) : "");

export const oldLoading = (ent, cx) => {
  const O = ui.old;
  return cx
    ? `<div class="cxgate">${O.busy[ent] || !O.err[ent] ? "<p>Loading…</p>" : `<h2>Could not load</h2><p>${esc(O.err[ent])}</p><button class="cxbtn" data-a="oldReload" data-ent="${esc(ent)}">Try again</button>`}</div>`
    : `<div class="card">${O.busy[ent] || !O.err[ent] ? '<div class="empty">Loading…</div>' : `<div class="warn">${esc(O.err[ent])}</div><button class="btn" data-a="oldReload" data-ent="${esc(ent)}">Try again</button>`}</div>`;
};

/* event center manager (tab) and owner (More > Old sales): status, log button, totals, records */
function vOldBody(ent) {
  const O = ui.old,
    st = O.st[ent],
    owner = isOwner();
  if (!st) return oldLoading(ent, false);
  const rows = oldRows(ent),
    sum = oldSum(rows),
    months = Object.keys(sum.months).sort().reverse(),
    e = esc(ent);
  return `<div class="card"><h2>${esc(entName(ent))}: old paper sales</h2><p class="s" style="margin:0 0 10px">${oldStatus(st)}</p>${O.err[ent] ? `<div class="warn">${esc(O.err[ent])}</div>` : ""}
    <div class="bar" style="margin:0"><button class="btn gold" data-a="oldOpen" data-ent="${e}">+ Log old sales</button>${owner ? `<button class="btn alt" data-a="oldCutoff" data-ent="${e}">Change cut-off date</button><button class="btn alt" data-a="oldCsv" data-ent="${e}">Download (Excel)</button>` : ""}</div></div>
    <div class="card"><h2>Logged so far <span>${sum.n} record${sum.n === 1 ? "" : "s"}</span></h2><div class="row"><div class="grow t">Total of old sales logged</div><div class="amt pos">${money(sum.total)}</div></div>${months.map((k) => `<div class="row"><div class="grow s">${esc(monthLabel(k))}</div><div class="amt">${money(sum.months[k])}</div></div>`).join("")}</div>
    <div class="card"><h2>Latest records</h2>${
      rows
        .slice(0, 100)
        .map(
          (r) =>
            `<div class="row"><div class="grow"><div class="t">${esc(fmtDay(r.date))} · ${esc(OLD_METHODS[r.method] || r.method)}</div><div class="s" style="white-space:normal">${esc(r.desc)}${oldWho(r)}</div></div><div class="amt">${money(r.amount)}</div>${owner ? `<button class="btn danger sm" data-a="oldDel" data-ent="${e}" data-id="${esc(r.id)}">Delete</button>` : ""}</div>`,
        )
        .join("") || '<div class="empty">Nothing logged yet.</div>'
    }${rows.length > 100 ? `<p class="s">Showing the latest 100 of ${rows.length}.${owner ? " Download for the full list." : ""}</p>` : ""}</div>`;
}

export const vOldTab = () => vOldBody("center");

export function vOldOwner() {
  const O = ui.old,
    ents = [["center", "Event center"], ...S.outlets.map((o) => [o.id, o.name])];
  if (!ents.some((x) => x[0] === O.ent)) O.ent = "center";
  return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button></div>${chips(ents.map(([id, n]) => `<button class="${O.ent === id ? "on" : ""}" data-a="oldEnt" data-ent="${esc(id)}">${esc(n)}</button>`).join(""))}${vOldBody(O.ent)}`;
}
