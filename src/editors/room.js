import { byId, cur } from "../state/selectors.js";
import { form } from "../components/form.js";
import { num } from "../domain/money.js";
import { del, save } from "../firebase/writes.js";

/* ---------- editors ---------- */
export function editRoom(id) {
  const r = id ? byId("rooms", id) : null;
  form(
    r ? "Edit room" : "New room",
    [
      { k: "name", label: "Room name / number", req: true, ph: "101" },
      { k: "type", label: "Type", ph: "Standard, Deluxe, Suite, Family…" },
      {
        k: "rateWeekday",
        label: `Weekday price per night (${cur()})`,
        type: "number",
        step: "0.01",
        req: true,
        def: r && r.rate,
      },
      {
        k: "rateWeekend",
        label: `Weekend price per night, Sat and Sun (${cur()}). Blank = same as weekday`,
        type: "number",
        step: "0.01",
      },
      { k: "capacity", label: "Sleeps (guests)", type: "number" },
      {
        k: "status",
        label: "Housekeeping status",
        type: "select",
        opts: [
          ["clean", "Clean and ready"],
          ["dirty", "Needs cleaning"],
          ["maintenance", "Out of order / maintenance"],
        ],
      },
      { k: "notes", label: "Notes", type: "textarea" },
    ],
    r || { status: "clean" },
    {
      onSave(o) {
        o.rate = num(o.rateWeekday);
        save("rooms", id, o);
      },
      onDelete: r ? () => del("rooms", id) : null,
    },
  );
}
