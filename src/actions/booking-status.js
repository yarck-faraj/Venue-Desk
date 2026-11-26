import { byId, money, stayBal } from "../state/selectors.js";
import { S } from "../state/store.js";
import { toast } from "../components/toast.js";
import { batchWrite, save } from "../firebase/writes.js";
import { today } from "../domain/dates.js";
import { audit } from "../firebase/audit.js";

export function doCheckIn(id) {
  const s = byId("stays", id),
    clash = S.stays.find(
      (x) => x.id !== id && x.status === "checkedin" && (x.roomIds || []).some((r) => s.roomIds.includes(r)),
    );
  if (clash) return toast("Room still occupied by " + clash.guestName);
  const bad = s.roomIds.map((r) => byId("rooms", r)).filter((r) => r && r.status !== "clean");
  if (
    bad.length &&
    !confirm(
      "Room " +
        bad.map((r) => r.name).join(", ") +
        " is marked " +
        bad.map((r) => (r.status === "dirty" ? "dirty" : "out of order")).join(", ") +
        ". Check in anyway?",
    )
  )
    return;
  save("stays", id, { status: "checkedin", checkedInAt: Date.now(), inDate: today() });
}

export function doCheckOut(id) {
  const s = byId("stays", id),
    b = stayBal(s);
  if (b > 0.005 && !confirm("This guest still owes " + money(b) + ". Check out anyway?")) return;
  if (b > 0.005) audit("checkout with balance", s.guestName + " owes " + money(b));
  batchWrite([
    ["stays", id, { status: "checkedout", outDate: today(), checkedOutAt: Date.now() }],
    ...s.roomIds.filter((r) => byId("rooms", r)).map((r) => ["rooms", r, { status: "dirty" }]),
  ]);
  toast("Checked out. Room marked for cleaning.");
}
