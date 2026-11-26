import { oldCutoffForm, oldOpen, olmCapture, olmRender, olmSave } from "../editors/old-sales.js";
import { oldLoad } from "../firebase/callables.js";
import { oldDelete } from "./old-record.js";
import { oldCsv } from "./files.js";
import { ui } from "../state/store.js";
import { closeModal } from "../components/modal.js";
import { num } from "../domain/money.js";

export const oldSalesActions = {
  oldOpen: (d) => oldOpen(d.ent),
  oldReload: (d) => oldLoad(d.ent),
  oldCutoff: (d) => oldCutoffForm(d.ent),
  oldDel: (d) => oldDelete(d.ent, d.id),
  oldCsv: (d) => oldCsv(d.ent),
  olmClose: () => {
    ui.olm = null;
    closeModal();
  },
  olmMode: (d) => {
    olmCapture();
    ui.olm.mode = d.k;
    ui.olm.err = "";
    ui.olm.msg = "";
    olmRender();
  },
  olmMethod: (d) => {
    olmCapture();
    ui.olm.method = d.k;
    olmRender();
  },
  olmDel: (d) => {
    olmCapture();
    ui.olm.lines.splice(+d.i, 1);
    olmRender();
  },
  olmAdd: () => {
    olmCapture();
    const M = ui.olm,
      v = M.vals,
      name = (v.name || "").trim(),
      qty = num(v.qty || 1),
      price = num(v.price);
    if (!name) {
      M.err = "Type or pick the item first.";
      return olmRender();
    }
    if (!(qty > 0)) {
      M.err = "The quantity must be more than zero.";
      return olmRender();
    }
    if (String(v.price || "").trim() === "") {
      M.err = "Type the price of " + name + ".";
      return olmRender();
    }
    M.lines.push({ name, qty, price });
    v.name = "";
    v.price = "";
    v.qty = "1";
    v.pick = "";
    M.err = "";
    M.msg = "";
    olmRender();
  },
  olmSave: () => olmSave(),
};
