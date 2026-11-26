import { editBooking } from "../editors/booking.js";
import { isOwner } from "../state/session.js";
import { editSpace } from "../editors/space.js";
import { toast } from "../components/toast.js";
import { editPerson } from "../editors/person.js";
import { ui } from "../state/store.js";
import { save } from "../firebase/writes.js";
import { byId } from "../state/selectors.js";

export const bookingsActions = {
  newBooking: () => editBooking(null),
  editBooking: (d) => editBooking(d.id),
  newSpace: () => (isOwner() ? editSpace(null) : toast("Only the owner can change prices")),
  editSpace: (d) => (isOwner() ? editSpace(d.id) : 0),
  newPerson: () => editPerson(ui.peopleTab, null),
  editPerson: (d) => editPerson(ui.peopleTab, d.id),
  confirmHold: (d) => save("bookings", d.id, { status: "confirmed" }),
  toggleCheck: (d, el) => {
    const b = byId("bookings", d.id),
      c = (b.checklist || []).map((x) => ({ ...x }));
    c[+d.i].done = el.checked;
    save("bookings", d.id, { checklist: c });
  },
  addCheck: (d) => {
    const t = prompt("Checklist item");
    if (!t) return;
    const b = byId("bookings", d.id);
    save("bookings", d.id, { checklist: [...(b.checklist || []), { t, done: false }] });
  },
};
