import { toast } from "../components/toast.js";
import { S } from "../state/store.js";
import { staff } from "../state/session.js";
import { BK_COLLS } from "../config/constants.js";
import { fs } from "./sdk.js";
import { today } from "../domain/dates.js";
import { recordBackup } from "../state/persist.js";
import { render } from "../app/render.js";
import { audit } from "./audit.js";

export async function doBackup() {
  if (!navigator.onLine) toast("Offline: the backup may be missing recent data from other devices");
  toast("Preparing backup…");
  try {
    const out = {
      app: "venue-desk",
      version: 1,
      exportedAt: new Date().toISOString(),
      venue: S.venue,
      oldSales: S.oldSales,
      staff: staff,
      collections: {},
    };
    for (const n of BK_COLLS) {
      const snap = await fs.collection(n).get();
      out.collections[n] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" }));
    a.download = "lynns-backup-" + today() + ".json";
    a.click();
    recordBackup();
    toast(
      "Backup downloaded: " + Object.values(out.collections).reduce((x, l) => x + l.length, 0) + " records",
    );
    render();
  } catch (e) {
    toast("Backup failed: " + e.message);
  }
}

export async function doRestore(file) {
  let j;
  try {
    j = JSON.parse(await file.text());
  } catch {
    return toast("That is not a valid backup file");
  }
  if (!j || j.app !== "venue-desk" || !j.collections) return toast("That is not a Venue Desk backup");
  const total = Object.values(j.collections).reduce((x, l) => x + l.length, 0);
  if (
    !confirm(
      "Restore " +
        total +
        " records from the backup made " +
        (j.exportedAt || "").slice(0, 10) +
        "?\n\nRecords with the same ID will be overwritten with the backup version. Nothing else is deleted.",
    )
  )
    return;
  try {
    const ops = [];
    Object.entries(j.collections).forEach(([n, l]) => {
      if (BK_COLLS.includes(n)) l.forEach(({ id, ...d }) => ops.push([n, id, d]));
    });
    if (j.venue && Object.keys(j.venue).length) ops.push(["settings", "venue", j.venue]);
    if (j.oldSales && Object.keys(j.oldSales).length) ops.push(["settings", "oldSales", j.oldSales]);
    for (let i = 0; i < ops.length; i += 400) {
      const b = fs.batch();
      ops.slice(i, i + 400).forEach(([n, id, d]) => b.set(fs.collection(n).doc(id), d));
      await b.commit();
    }
    audit("restore", "Backup of " + (j.exportedAt || "").slice(0, 10) + ": " + ops.length + " records");
    toast("Restored " + ops.length + " records");
  } catch (e) {
    toast("Restore failed: " + e.message);
  }
}
