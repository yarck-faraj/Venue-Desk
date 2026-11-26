import { AUDIT_TTL_DAYS } from "../config/constants.js";
import { fs } from "./sdk.js";
import { isOwner, me } from "../state/session.js";
import { today } from "../domain/dates.js";
import { auditRange } from "../state/selectors.js";
import { S, ui } from "../state/store.js";
import { render } from "../app/render.js";
import { toast } from "../components/toast.js";

/* activity log (owner reads it): who did something that deserves a second look */
export function audit(action, detail) {
  if (!fs || !me) return;
  fs.collection("audit")
    .doc()
    .set({
      action,
      detail: String(detail || "").slice(0, 300),
      by: (me.email || "").toLowerCase(),
      ts: Date.now(),
      date: today(),
      expireAt: new Date(Date.now() + AUDIT_TTL_DAYS * 864e5),
    })
    .catch(() => {});
}

export async function loadAudit() {
  if (!isOwner()) return;
  const [from, to] = auditRange();
  ui.alLoading = true;
  render();
  try {
    const snap = await fs
      .collection("audit")
      .where("ts", ">=", from)
      .where("ts", "<=", to)
      .orderBy("ts", "desc")
      .limit(500)
      .get();
    S.audit = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    ui.alCapped = snap.docs.length >= 500;
  } catch (e) {
    toast("Could not load the log: " + e.message);
  }
  ui.alLoading = false;
  render();
}
