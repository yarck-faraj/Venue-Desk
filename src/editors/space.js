import { byId, cur } from "../state/selectors.js";
import { form } from "../components/form.js";
import { num } from "../domain/money.js";
import { del, save } from "../firebase/writes.js";

export function editSpace(id) {
  const s = id ? byId("spaces", id) : null;
  form(
    s ? "Edit space" : "New hall / space",
    [
      { k: "name", label: "Name", req: true, ph: "Main Hall" },
      { k: "capacity", label: "Capacity (guests)", type: "number" },
      { k: "rateWeekday", label: `Weekday price (${cur()})`, type: "number", step: "0.01", def: s && s.rate },
      { k: "rateWeekend", label: `Weekend price, Sat and Sun (${cur()})`, type: "number", step: "0.01" },
      { k: "notes", label: "Notes", type: "textarea" },
    ],
    s,
    {
      onSave(o) {
        o.rate = num(o.rateWeekday);
        save("spaces", id, o);
      },
      onDelete: s ? () => del("spaces", id) : null,
    },
  );
}
