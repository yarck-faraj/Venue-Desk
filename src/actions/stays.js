import { editExtra, editStay } from "../editors/stay.js";
import { addDays, today } from "../domain/dates.js";
import { doCheckIn, doCheckOut } from "./booking-status.js";
import { isOwner } from "../state/session.js";
import { editRoom } from "../editors/room.js";
import { toast } from "../components/toast.js";
import { byId, roomState } from "../state/selectors.js";
import { S, ui } from "../state/store.js";
import { render } from "../app/render.js";
import { save } from "../firebase/writes.js";

export const staysActions = {
  newStay: () => editStay(null),
  editStay: (d) => editStay(d.id),
  newStayCell: (d) => editStay(null, { roomIds: [d.room], checkIn: d.day, checkOut: addDays(d.day, 1) }),
  checkIn: (d) => doCheckIn(d.id),
  checkOut: (d) => doCheckOut(d.id),
  addExtra: (d) => editExtra(d.id, null),
  editExtra: (d) => editExtra(d.id, +d.i),
  newRoom: () => (isOwner() ? editRoom(null) : toast("Only the owner can change prices")),
  editRoom: (d) => (isOwner() ? editRoom(d.id) : 0),
  roomTap: (d) => {
    const r = byId("rooms", d.id),
      st = roomState(r);
    if (st === "occupied") {
      ui.stayDetail = S.stays.find((s) => s.status === "checkedin" && s.roomIds.includes(r.id)).id;
      render();
    } else if (st === "arriving") {
      ui.stayDetail = S.stays.find(
        (s) => s.status === "reserved" && s.roomIds.includes(r.id) && s.checkIn <= today(),
      ).id;
      render();
    } else if (st === "dirty") {
      if (confirm("Mark room " + r.name + " as cleaned and ready?")) save("rooms", r.id, { status: "clean" });
    } else if (st === "maintenance") editRoom(r.id);
    else editStay(null, { roomIds: [r.id] });
  },
};
