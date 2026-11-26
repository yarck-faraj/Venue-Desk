import { S, ui } from "../../state/store.js";
import { auditFiltered } from "../../state/selectors.js";
import { staff } from "../../state/session.js";
import { filterButtons } from "../../components/seg.js";
import { esc } from "../../utils/dom.js";

export function vAudit() {
  const al = ui.al,
    list = auditFiltered();
  const people = [...new Set([...(staff.emails || []), ...S.audit.map((a) => a.by)].filter(Boolean))].sort();
  const actions = [...new Set(S.audit.map((a) => a.action))].sort();
  const seg = filterButtons(
    [
      ["today", "Today"],
      ["7", "7 days"],
      ["30", "30 days"],
      ["90", "90 days"],
      ["365", "1 year"],
      ["custom", "Custom"],
    ],
    al.range,
    "alRange",
  );
  const counts = {};
  list.forEach((a) => (counts[a.action] = (counts[a.action] || 0) + 1));
  let lastDay = "";
  const rows = list
    .map((a) => {
      const day = new Date(a.ts).toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const head =
        day !== lastDay ? `<div class="s" style="font-weight:650;margin:12px 0 2px">${esc(day)}</div>` : "";
      lastDay = day;
      return (
        head +
        `<div class="row"><div class="grow"><div class="t">${esc(a.action)}</div><div class="s">${esc(a.detail || "")}<br>${esc((a.by || "").split("@")[0])} · ${esc(new Date(a.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</div></div></div>`
      );
    })
    .join("");
  return `<div class="bar"><button class="btn alt sm" data-a="sub" data-k="">‹ Back</button><span class="grow"></span><button class="btn alt sm" data-a="alRefresh">Refresh</button><button class="btn alt sm" data-a="alCsv">Export</button></div>
  <div class="card"><h2>Filter</h2><div class="bar"><div class="seg" style="overflow-x:auto">${seg}</div></div>
    ${al.range === "custom" ? `<div class="bar"><label class="f" style="margin:0;flex:1"><span>From</span><input type="date" id="alFrom" data-a="alFrom" value="${esc(al.from)}"></label><label class="f" style="margin:0;flex:1"><span>To</span><input type="date" id="alTo" data-a="alTo" value="${esc(al.to)}"></label></div>` : ""}
    <div class="bar"><select data-a="alStaff" style="flex:1"><option value="">All staff</option>${people.map((e) => `<option value="${esc(e)}" ${al.staff === e ? "selected" : ""}>${esc(e)}</option>`).join("")}</select>
    <select data-a="alAction" style="flex:1"><option value="">All actions</option>${actions.map((x) => `<option value="${esc(x)}" ${al.action === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
    <input id="alq" placeholder="Search the log (receipt number, name, reason…)" value="${esc(al.q)}"></div>
  <div class="card"><h2>${ui.alLoading ? "Loading…" : list.length + " entr" + (list.length === 1 ? "y" : "ies")}</h2>
    ${
      Object.keys(counts).length
        ? `<div class="s" style="margin-bottom:6px">${Object.entries(counts)
            .map(([k, v]) => esc(k) + ": " + v)
            .join(" · ")}</div>`
        : ""
    }
    ${ui.alCapped ? '<div class="warn">Showing the latest 500 entries in this period. Narrow the dates to see older ones.</div>' : ""}
    ${rows || (ui.alLoading ? "" : '<div class="empty">Nothing matches these filters.</div>')}</div>
  <p class="s">Voids, discounts, deletions, stock adjustments, refunds, till differences, checkouts with unpaid bills, staff changes and restores are recorded here. Entries cannot be edited or deleted from the app. They are kept until an administrator removes them in the Firebase console, with no automatic deletion.</p>`;
}
