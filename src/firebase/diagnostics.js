import { ui } from "../state/store.js";
import { render } from "../app/render.js";
import { DIAG_READ } from "../config/constants.js";
import { fs } from "./sdk.js";
import { today } from "../domain/dates.js";
import { me } from "../state/session.js";

export async function runDiagnostics() {
  const rows = (ui.diag = []),
    upd = () => {
      if (ui.sub === "diag") render();
    },
    lim = (p, ms = 9000) =>
      Promise.race([
        p,
        new Promise((_, no) =>
          setTimeout(
            () =>
              no(
                Object.assign(new Error("no answer from the server in 9 seconds (offline?)"), {
                  code: "timeout",
                }),
              ),
            ms,
          ),
        ),
      ]);
  const probe = async (label, fn) => {
    try {
      await lim(fn());
      rows.push([label, true, ""]);
    } catch (e) {
      rows.push([
        label,
        false,
        ((e && e.code) || "") +
          " " +
          String((e && e.message) || e)
            .replace(/^FirebaseError: /, "")
            .slice(0, 140),
      ]);
    }
    upd();
  };
  for (const c of DIAG_READ) await probe("Read " + c, () => fs.collection(c).limit(1).get());
  const t = "_check_" + Date.now().toString(36);
  for (const [c, d] of /** @type {Array<[string,object]>} */ ([
    [
      "expenses",
      {
        amount: 1,
        category: "Check setup",
        date: today(),
        note: "test entry, safe to ignore",
        entity: "",
        vendorId: "",
        bookingId: "",
      },
    ],
    ["expenseCategories", { name: "_check" }],
    ["stockCosts", { cost: 0 }],
    ["crewPay", { pay: {} }],
  ]))
    await probe("Save and remove a test record in " + c, async () => {
      const r = fs.collection(c).doc(t);
      await r.set({ ...d, updatedAt: Date.now(), updatedBy: me.email });
      await r.delete();
    });
  rows.push(["done", true, ""]);
  upd();
}
