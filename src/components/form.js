import { isOwner } from "../state/session.js";
import { renderField } from "./form-fields.js";
import { $, esc } from "../utils/dom.js";
import { num } from "../domain/money.js";
import { closeModal } from "./modal.js";
import { audit } from "../firebase/audit.js";

/* ---------- forms ---------- */
export function form(title, fields, vals, o = {}) {
  vals = vals || {};
  fields = fields.filter((f) => !f.ownerOnly || isOwner());
  const html = fields.map((field) => renderField(field, vals)).join("");
  $("#modal").innerHTML =
    `<div class="overlay"><form class="sheet" id="mf"><h3>${esc(title)}<button type="button" class="x" data-a="closeModal">×</button></h3>
    <div id="mwarn"></div>${html}
    <div style="display:flex;gap:8px;margin-top:6px"><button class="btn" style="flex:1">Save</button>${o.onDelete ? `<button type="button" class="btn danger" id="mdel">${esc(o.delText || "Delete")}</button>` : ""}</div></form></div>`;
  const f = $("#mf");
  f.onsubmit = (e) => {
    e.preventDefault();
    const out = {};
    fields.forEach((fd) => {
      if (fd.type === "info") return;
      if (fd.type === "checks")
        out[fd.k] = [...f.querySelectorAll(`[name="${fd.k}"]:checked`)].map(
          (i) => /** @type {HTMLInputElement} */ (i).value,
        );
      else {
        const v = /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (
          f.elements[fd.k]
        ).value.trim();
        out[fd.k] = fd.type === "number" ? (v === "" ? 0 : num(v)) : v;
      }
    });
    for (const fd of fields)
      if (fd.req && (!out[fd.k] || (Array.isArray(out[fd.k]) && !out[fd.k].length))) {
        $("#mwarn").innerHTML = `<div class="warn">${esc(fd.label)} is required.</div>`;
        return;
      }
    if (o.validate) {
      const msg = o.validate(out, !!f.dataset.force);
      if (msg) {
        $("#mwarn").innerHTML = `<div class="warn">${msg}</div>`;
        return;
      }
    }
    closeModal();
    o.onSave(out);
  };
  if (o.onDelete)
    $("#mdel").onclick = () => {
      if (confirm(o.delConfirm || "Delete this record? This cannot be undone.")) {
        audit(
          "delete",
          title + ": " + (vals.name || vals.title || vals.guestName || vals.amount || vals.note || ""),
        );
        o.onDelete();
        closeModal();
      }
    };
}
