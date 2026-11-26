import { byId } from "../state/selectors.js";
import { form } from "../components/form.js";
import { del, save } from "../firebase/writes.js";

export function editPerson(kind, id) {
  const c = id ? byId(kind, id) : null,
    v = kind === "vendors";
  form(
    (c ? "Edit " : "New ") + (v ? "vendor" : "client"),
    [
      { k: "name", label: "Name", req: true },
      ...(v ? [{ k: "service", label: "Service", ph: "Caterer, DJ, decorator…" }] : []),
      { k: "phone", label: "Phone", type: "tel" },
      { k: "email", label: "Email", type: "email" },
      { k: "notes", label: "Notes", type: "textarea" },
    ],
    c,
    {
      onSave(o) {
        save(kind, id, o);
      },
      onDelete: c ? () => del(kind, id) : null,
    },
  );
}
