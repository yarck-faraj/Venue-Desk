import { isOwner } from "../state/session.js";
import { ui } from "../state/store.js";

/* ---------- owner overview ---------- */
export const moneySeg = () =>
  isOwner()
    ? `<button class="${ui.money === "overview" ? "on" : ""}" data-a="moneyTab" data-k="overview">Overview</button>`
    : "";

export function filterButtons(options, selected, action) {
  return options
    .map(
      ([key, label]) =>
        `<button class="${selected === key ? "on" : ""}" data-a="${action}" data-k="${key}">${label}</button>`,
    )
    .join("");
}
