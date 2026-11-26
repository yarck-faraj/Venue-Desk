import { esc } from "../utils/dom.js";

export function renderField(f, vals) {
  if (f.type === "info")
    return `<div class="f"><span>${esc(f.label)}</span><div class="s">${esc(f.text)}</div></div>`;
  const v = vals[f.k] ?? f.def ?? "";
  let inp;
  if (f.type === "select")
    inp = `<select name="${f.k}">${f.opts.map(([val, lab]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(lab)}</option>`).join("")}</select>`;
  else if (f.type === "combo")
    inp = `<input name="${f.k}" list="dl_${f.k}" value="${esc(v)}" autocomplete="off" placeholder="${esc(f.ph || "")}"><datalist id="dl_${f.k}">${f.opts.map((x) => `<option value="${esc(x)}"></option>`).join("")}</datalist>`;
  else if (f.type === "textarea")
    inp = `<textarea name="${f.k}" rows="${f.rows || 3}" placeholder="${esc(f.ph || "")}">${esc(v)}</textarea>`;
  else if (f.type === "checks")
    inp = `<div class="checks">${f.opts.map(([val, lab]) => `<label><input type="checkbox" name="${f.k}" value="${esc(val)}" ${(v || []).includes(val) ? "checked" : ""}>${esc(lab)}</label>`).join("") || '<span class="s">None yet. Add them under More.</span>'}</div>`;
  else
    inp = `<input name="${f.k}" type="${f.type || "text"}" value="${esc(v)}" ${f.step ? `step="${f.step}"` : ""} placeholder="${esc(f.ph || "")}" ${f.type === "number" ? 'inputmode="decimal"' + (f.neg ? "" : f.k === "amount" ? ' min="0.01"' : ' min="0"') : ""}>`;
  return `<label class="f"><span>${esc(f.label)}</span>${inp}</label>`;
}
