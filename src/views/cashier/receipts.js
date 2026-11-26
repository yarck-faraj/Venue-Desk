import { S } from "../../state/store.js";
import { today } from "../../domain/dates.js";
import { esc } from "../../utils/dom.js";
import { METHODS } from "../../config/constants.js";
import { money } from "../../state/selectors.js";

export function cashierReceipts() {
  return `<div class="cxlist">${
    S.sales
      .filter((s) => s.date === today())
      .sort((a, b) => b.ts - a.ts)
      .map(
        (s) =>
          `<div class="cxrow tap" data-a="openSale" data-id="${s.id}"><b>#${esc(s.no)}</b><span>${new Date(s.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${esc(METHODS[s.method] || s.method)}</span><b>${money(s.total)}</b></div>`,
      )
      .join("") || '<div class="cxempty">No sales yet today</div>'
  }</div>`;
}
