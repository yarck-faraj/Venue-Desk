import { callable, fs } from "./sdk.js";
import { ui } from "../state/store.js";
import { render } from "../app/render.js";

export const oldCall = async (data) => (await callable("oldSales")(data)).data;

export function oldErr(e) {
  const m = String((e && e.message) || e).replace(/^FirebaseError: /, "");
  if (e && e.code === "functions/not-found" && (/^NOT_FOUND$/i.test(m) || /function/i.test(m)))
    return "The old-sales function is not deployed yet. Ask the developer to run: firebase deploy --only functions";
  if (/unavailable|network|offline|failed to fetch/i.test(m))
    return "No internet connection. Old sales can only be saved while online.";
  return m;
}

export async function oldLoad(ent) {
  const O = ui.old;
  if (!ent || !fs || O.busy[ent]) return;
  O.busy[ent] = true;
  O.err[ent] = "";
  render();
  try {
    O.st[ent] = await oldCall({ action: "status", entity: ent });
    if (ent !== "center")
      O.list[ent] = (
        await fs.collection("sales").where("outletId", "==", ent).where("legacy", "==", true).get()
      ).docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    O.err[ent] = oldErr(e);
  }
  O.busy[ent] = false;
  render();
}

export function resetStaffPassword(email, password) {
  return callable("resetStaffPassword")({ email, password });
}
