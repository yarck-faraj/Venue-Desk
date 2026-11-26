import { A } from "./index.js";
import { ui } from "../state/store.js";
import { render } from "../app/render.js";
import { loadAudit } from "../firebase/audit.js";
import { olPick } from "../editors/old-sales.js";
import { doRestore } from "../firebase/backup.js";
import { doAuth } from "../firebase/auth.js";
import { role } from "../state/session.js";
import { scanClose, scanItem } from "../hardware/scanner.js";
import { toast } from "../components/toast.js";
import { syncState } from "../firebase/listeners.js";
import { pend } from "../firebase/listener-state.js";

export function registerDispatcher() {
  document.addEventListener("click", (ev) => {
    const el = /** @type {HTMLInputElement | null} */ (
      /** @type {Element} */ (ev.target).closest("[data-a]")
    );
    if (!el || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type === "checkbox")) return;
    if (A[el.dataset.a]) A[el.dataset.a](el.dataset, el, ev);
  });

  document.addEventListener("change", (ev) => {
    const el = /** @type {HTMLInputElement | null} */ (
      /** @type {Element} */ (ev.target).closest("[data-a]")
    );
    if (!el) return;
    if (el.dataset.a === "spaceFilter") {
      ui.spaceFilter = el.value;
      render();
    } else if (el.dataset.a === "alStaff") {
      ui.al.staff = el.value;
      render();
    } else if (el.dataset.a === "alAction") {
      ui.al.action = el.value;
      render();
    } else if (el.dataset.a === "alFrom") {
      ui.al.from = el.value;
      loadAudit();
    } else if (el.dataset.a === "alTo") {
      ui.al.to = el.value;
      loadAudit();
    } else if (el.dataset.a === "toggleCheck") A.toggleCheck(el.dataset, el);
    else if (el.dataset.a === "olPick") olPick(el.value);
  });

  document.addEventListener("input", (ev) => {
    const t = /** @type {HTMLInputElement} */ (ev.target);
    if (t.id === "sq") {
      ui.sq = t.value;
      render();
    } else if (t.id === "q") {
      ui.q = t.value;
      render();
    } else if (t.id === "alq") {
      ui.al.q = t.value;
      render();
    } else if (t.id === "stq") {
      ui.stq = t.value;
      render();
    } else if (t.id === "pq") {
      ui.pos.q = t.value;
      render();
    }
  });

  document.addEventListener("change", (ev) => {
    const target = /** @type {HTMLInputElement} */ (ev.target);
    if (target.id === "restoreFile" && target.files[0]) {
      doRestore(target.files[0]);
      target.value = "";
    }
  });

  document.addEventListener("keydown", async (ev) => {
    const input = /** @type {HTMLInputElement} */ (ev.target);
    if (ev.key === "Enter" && input.id === "pw") doAuth("signin");
    if (ev.key === "Enter" && input.id === "pq" && role() === "cashier") {
      // a keyboard-style scanner types the code and presses Enter
      const v = input.value.trim();
      if (!v) return;
      ev.preventDefault();
      if (await scanItem(v)) {
        ui.pos.q = "";
        render();
      } else if (/^\d{6,}$/.test(v)) {
        toast("No product with barcode " + v);
        ui.pos.q = "";
        render();
      }
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) scanClose();
  });

  addEventListener("online", syncState);

  addEventListener("offline", syncState);

  addEventListener("beforeunload", (e) => {
    if (Object.values(pend).some((n) => n > 0)) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  let lastErr = 0;

  addEventListener("error", (e) => {
    console.error(e.error || e.message);
    if (Date.now() - lastErr > 5000) {
      lastErr = Date.now();
      toast("Something went wrong. Your saved data is safe. Refresh if the screen looks stuck.");
    }
  });

  addEventListener("unhandledrejection", (e) => {
    console.error(e.reason);
  });
}
