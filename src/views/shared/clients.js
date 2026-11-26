import { S, ui } from "../../state/store.js";
import { esc } from "../../utils/dom.js";

export function vClients() {
  ui.peopleTab = "clients";
  const list = S.clients.slice().sort((a, b) => a.name.localeCompare(b.name));
  return `<div class="bar"><span class="grow"></span><button class="btn gold sm" data-a="newPerson">+ Add client</button></div><div class="card">${list.map((c) => `<div class="row tap" data-a="editPerson" data-id="${c.id}"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc([c.phone, c.email].filter(Boolean).join(" · "))}</div></div><span class="s">${S.bookings.filter((b) => b.clientId === c.id).length} events</span></div>`).join("") || '<div class="empty">No clients yet.</div>'}</div>`;
}
