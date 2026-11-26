import { byId } from "../state/selectors.js";
import { form } from "../components/form.js";
import { save } from "../firebase/writes.js";

export function editOutlet(id) {
  const o = id ? byId("outlets", id) : null;
  form(o ? "Edit outlet" : "New outlet", [{ k: "name", label: "Name", req: true }], o ? { ...o } : {}, {
    onSave(d) {
      save("outlets", id, { name: d.name });
    },
    onDelete: null,
  });
}
