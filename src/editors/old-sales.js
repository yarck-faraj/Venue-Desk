import { OLD_BAR_METHODS, OLD_CENTER_METHODS, OLD_KIND, OLD_METHODS } from "../config/constants.js";
import { S, ui } from "../state/store.js";
import { oldCall, oldErr, oldLoad } from "../firebase/callables.js";
import { toast } from "../components/toast.js";
import { $, esc } from "../utils/dom.js";
import { cur, entName, money } from "../state/selectors.js";
import { num } from "../domain/money.js";
import { addDays, fmtDay } from "../domain/dates.js";
import { form } from "../components/form.js";
import { saveOldCutoff } from "../firebase/writes.js";
import { audit } from "../firebase/audit.js";

/* the entry window (a modal, so a screen refresh never wipes what is being typed) */
export function oldOpen(ent) {
  if (ui.oldOpening) return;
  ui.oldOpening = true;
  oldCall({ action: "status", entity: ent })
    .then((st) => {
      ui.old.st[ent] = st;
      ui.olm = {
        ent,
        max: st.lastDay,
        cutoff: st.cutoff,
        mode: "total",
        method: "cash",
        lines: [],
        date: "",
        vals: { qty: "1" },
        busy: false,
        msg: "",
        err: "",
      };
      olmRender();
    })
    .catch((e) => toast("Could not open the old-sales form: " + oldErr(e)))
    .finally(() => {
      ui.oldOpening = false;
    });
}

export function olmCapture() {
  const M = ui.olm;
  if (!M) return;
  document.querySelectorAll("#modal [id^=ol-]").forEach((el) => {
    const k = el.id.slice(3);
    if (k === "date") M.date = /** @type {HTMLInputElement} */ (el).value;
    else M.vals[k] = /** @type {HTMLInputElement | HTMLSelectElement} */ (el).value;
  });
}

export function olmRender() {
  const M = ui.olm;
  if (!M) return;
  const v = M.vals,
    center = M.ent === "center";
  const inp = (k, label, ph, type) =>
    `<label class="f"><span>${label}</span><input id="ol-${k}" type="${type || "text"}" ${type === "number" ? 'inputmode="decimal" step="0.01" min="0"' : 'autocomplete="off"'} value="${esc(v[k] ?? "")}" placeholder="${esc(ph || "")}"></label>`;
  const opt = (val, label, cur_) =>
    `<option value="${esc(val)}" ${val === cur_ ? "selected" : ""}>${esc(label)}</option>`;
  let body;
  if (center) {
    body = `<label class="f"><span>What was it for?</span><select id="ol-what">${Object.entries(OLD_KIND)
      .map(([k, l]) => opt(k, l, v.what || "hall"))
      .join("")}</select></label>
      ${inp("name", "Client or guest (optional)", "e.g. Mensah wedding")}${inp("note", "Description or receipt number (optional)", "e.g. Main Hall, balance")}${inp("amount", "Amount received (" + cur() + ")", "", "number")}
      <label class="f"><span>Paid by</span><select id="ol-method">${OLD_CENTER_METHODS.map((m) => opt(m, OLD_METHODS[m], v.method || "cash")).join("")}</select></label>`;
  } else if (M.mode === "total") {
    body = `<p class="s" style="margin:0 0 10px">One day's takings from the paper book. Leave out any payment type that had nothing.</p>${inp("cash", "Cash total (" + cur() + ")", "0", "number")}${inp("momo", "Mobile money total (" + cur() + ")", "0", "number")}${inp("card", "Card total (" + cur() + ")", "0", "number")}${inp("note", "Note (optional)")}`;
  } else {
    M.opts = S.products
      .filter((p) => p.outletId === M.ent)
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((p) =>
        (p.variations || []).length
          ? p.variations.map((x) => ({
              key: p.id + "|" + x.size,
              name: p.name + " · " + x.size,
              price: num(x.price),
            }))
          : [{ key: p.id, name: p.name, price: num(p.price) }],
      );
    const tot = M.lines.reduce((a, l) => a + l.qty * l.price, 0);
    body = `<div class="f"><span style="color:var(--mute);font-size:13px;font-weight:600;display:block;margin-bottom:4px">Paid by</span><div class="seg">${OLD_BAR_METHODS.map((m) => `<button type="button" class="${M.method === m ? "on" : ""}" data-a="olmMethod" data-k="${m}">${OLD_METHODS[m]}</button>`).join("")}</div></div>
      <label class="f"><span>Pick from the menu, or type your own below</span><select id="ol-pick" data-a="olPick"><option value="">— type my own —</option>${M.opts.map((o) => opt(o.key, o.name + " · " + money(o.price), v.pick)).join("")}</select></label>
      ${inp("name", "Item name")}<div style="display:flex;gap:8px"><div style="flex:1">${inp("qty", "Quantity", "1", "number")}</div><div style="flex:1">${inp("price", "Price each (" + cur() + ")", "", "number")}</div></div>
      <button type="button" class="btn alt" style="width:100%;margin-bottom:12px" data-a="olmAdd">+ Add this item</button>
      ${M.lines.map((l, i) => `<div class="row"><div class="grow"><div class="t">${l.qty} × ${esc(l.name)}</div><div class="s">${money(l.price)} each</div></div><div class="amt">${money(l.qty * l.price)}</div><button type="button" class="x" data-a="olmDel" data-i="${i}">×</button></div>`).join("")}
      ${M.lines.length ? `<div class="total" style="margin:10px 0 14px"><span>Sale total</span><span>${money(tot)}</span></div>` : ""}${inp("note", "Note (optional)")}`;
  }
  $("#modal").innerHTML =
    `<div class="overlay"><div class="sheet"><h3>Log old sales · ${esc(entName(M.ent))}<button class="x" data-a="olmClose">×</button></h3>
    <div class="warn">Only days <b>before ${esc(fmtDay(M.cutoff))}</b> can be logged (last day: ${esc(fmtDay(M.max))}). From that day on, sales come from the app.</div>
    ${M.msg ? `<div class="free" style="margin-bottom:10px">${esc(M.msg)}</div>` : ""}${M.err ? `<div class="warn" style="background:#f7dcd8;border-color:#e8b3ac;color:#8e2a21">${esc(M.err)}</div>` : ""}
    <label class="f"><span>Date of the sale${!center && M.mode === "total" ? "s (the day)" : ""}</span><input id="ol-date" type="date" max="${esc(M.max)}" value="${esc(M.date)}"></label>
    ${center ? "" : `<div class="seg" style="margin-bottom:12px"><button type="button" class="${M.mode === "total" ? "on" : ""}" data-a="olmMode" data-k="total">Day total</button><button type="button" class="${M.mode === "items" ? "on" : ""}" data-a="olmMode" data-k="items">Item by item</button></div>`}
    ${body}
    <div style="display:flex;gap:8px;margin-top:6px"><button type="button" class="btn" style="flex:1" data-a="olmSave" ${M.busy ? "disabled" : ""}>${M.busy ? "Saving…" : "Save"}</button><button type="button" class="btn alt" data-a="olmClose">Done</button></div></div></div>`;
}

export function olPick(key) {
  olmCapture();
  const M = ui.olm,
    o = (M.opts || []).find((x) => x.key === key);
  M.vals.pick = key;
  if (o) {
    M.vals.name = o.name;
    M.vals.price = String(o.price);
  }
  olmRender();
}

export async function olmSave() {
  const M = ui.olm;
  if (!M || M.busy) return;
  olmCapture();
  const v = M.vals;
  M.err = "";
  M.msg = "";
  const fail = (t) => {
    M.err = t;
    olmRender();
  };
  if (!M.date) return fail("Pick the date first.");
  if (M.date > M.max)
    return fail(
      "That day is not allowed. Old sales can only be logged for days before " + fmtDay(M.cutoff) + ".",
    );
  let entry;
  if (M.ent === "center") {
    const amount = num(v.amount);
    if (!(amount > 0)) return fail("Enter the amount received.");
    entry = {
      kind: "center",
      date: M.date,
      amount,
      method: v.method || "cash",
      what: v.what || "hall",
      name: (v.name || "").trim(),
      note: (v.note || "").trim(),
    };
  } else if (M.mode === "total") {
    const cash = num(v.cash),
      momo = num(v.momo),
      card = num(v.card);
    if (!(cash + momo + card > 0)) return fail("Enter at least one amount.");
    entry = { kind: "total", date: M.date, cash, momo, card, note: (v.note || "").trim() };
  } else {
    if (!M.lines.length) return fail("Add at least one item (tap “+ Add this item”).");
    entry = {
      kind: "sale",
      date: M.date,
      method: M.method,
      items: M.lines.map((l) => ({ ...l })),
      note: (v.note || "").trim(),
    };
  }
  M.busy = true;
  olmRender();
  try {
    const r = await oldCall({ action: "log", entity: M.ent, entries: [entry] });
    M.msg = "Saved " + money(r.total) + " for " + fmtDay(entry.date) + ". You can add another.";
    if (M.ent === "center") {
      v.amount = "";
      v.name = "";
      v.note = "";
    } else if (M.mode === "total") {
      v.cash = v.momo = v.card = v.note = "";
    } else {
      M.lines = [];
      v.note = "";
      v.name = "";
      v.price = "";
      v.pick = "";
      v.qty = "1";
    }
    M.busy = false;
    olmRender();
    oldLoad(M.ent);
  } catch (e) {
    M.busy = false;
    M.err = oldErr(e);
    olmRender();
  }
}

/* owner: cut-off date per bar and for the event center */
export function oldCutoffForm(ent) {
  const st = /** @type {Partial<import("../state/models.js").PaperStatus>} */ (ui.old.st[ent] || {}),
    manual = ((S.oldSales || {}).cutoff || {})[ent] || "";
  form(
    "Cut-off date · " + entName(ent),
    [
      {
        k: "how",
        type: "info",
        label: "How it works",
        text:
          "Old sales can only be logged for days before this date. From this date on, every sale must come from the app. Leave it empty to use the first day the app is used for real" +
          (st.auto ? " (right now: " + fmtDay(st.auto) + ")" : " (the app has not been used yet)") +
          ".",
      },
      { k: "cutoff", label: "First day the app records sales", type: "date" },
    ],
    { cutoff: manual },
    {
      onSave(o) {
        const d = String(o.cutoff || "").trim();
        if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return toast("Could not save: that is not a valid date");
        if (
          d &&
          st.auto &&
          d > st.auto &&
          !confirm(
            "The app has already been used for real sales from " +
              fmtDay(st.auto) +
              ".\n\nIf the cut-off is " +
              fmtDay(d) +
              ", the days from " +
              fmtDay(st.auto) +
              " to " +
              fmtDay(addDays(d, -1)) +
              " could be counted twice (once from the app, once from old records).\n\nSet it anyway?",
          )
        )
          return;
        saveOldCutoff(ent, d)
          .then(() => {
            audit(
              "old sales",
              "Cut-off for " + entName(ent) + (d ? " set to " + d : " set back to automatic"),
            );
            toast(d ? "Cut-off saved: " + fmtDay(d) : "Cut-off is automatic again");
            oldLoad(ent);
          })
          .catch((e) => toast("Could not save the cut-off date: " + e.message));
      },
    },
  );
}
