import { isOwner, me } from "../state/session.js";
import { S, ui } from "../state/store.js";
import { lsnap } from "./listener-state.js";
import { FV, fs } from "./sdk.js";
import { num } from "../domain/money.js";
import { byId } from "../state/selectors.js";
import { crewKey } from "../domain/crew.js";
import { audit } from "./audit.js";
import { toast } from "../components/toast.js";

export function migrateSecrets() {
  // older versions kept stock cost, crew pay and sale cost on documents that cashiers/managers can read
  if (
    !isOwner() ||
    ui.migrated ||
    !["stock", "stockCosts", "bookings", "crewPay", "sales"].every((k) => lsnap[k])
  )
    return;
  const ops = [],
    now = Date.now(),
    by = me.email,
    DEL = FV().delete();
  S.stock
    .filter((i) => i.cost !== undefined)
    .forEach((i) => {
      ops.push([
        "set",
        "stockCosts",
        i.id,
        { cost: num(i.cost), outletId: i.outletId || "", updatedAt: now, updatedBy: by },
        true,
      ]);
      ops.push(["update", "stock", i.id, { cost: DEL }]);
    });
  S.bookings
    .filter((b) => (b.crew || []).some((c) => c.pay !== undefined))
    .forEach((b) => {
      const pay = { ...((byId("crewPay", b.id) || {}).pay || {}) };
      b.crew.forEach((c) => {
        if (c.pay !== undefined && num(c.pay)) pay[crewKey(c)] = num(c.pay);
      });
      ops.push(["set", "crewPay", b.id, { pay, updatedAt: now, updatedBy: by }, false]);
      ops.push([
        "update",
        "bookings",
        b.id,
        { crew: b.crew.map((c) => ({ name: c.name || "", role: c.role || "" })) },
      ]);
    });
  S.sales
    .filter((x) => x.cogs !== undefined)
    .forEach((x) => ops.push(["update", "sales", x.id, { cogs: DEL }]));
  ui.migrated = true;
  if (!ops.length) return;
  (async () => {
    try {
      for (let k = 0; k < ops.length; k += 400) {
        const b = fs.batch();
        ops
          .slice(k, k + 400)
          .forEach(([op, c, id, d, m]) =>
            op === "set"
              ? b.set(fs.collection(c).doc(id), d, { merge: !!m })
              : b.update(fs.collection(c).doc(id), d),
          );
        await b.commit();
      }
      audit("privacy clean-up", ops.length + " records moved to owner-only storage");
      toast("Cost and crew-pay figures moved to owner-only storage");
    } catch (e) {
      ui.migrated = false;
      console.error(e);
      toast("Privacy clean-up could not finish: " + e.message);
    }
  })();
}
