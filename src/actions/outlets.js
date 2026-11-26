import { byId } from "../state/selectors.js";
import { S } from "../state/store.js";
import { removeOutlet } from "../firebase/writes.js";
import { toast } from "../components/toast.js";
import { audit } from "../firebase/audit.js";

export function deleteOutlet(id) {
  const o = byId("outlets", id),
    prods = S.products.filter((p) => p.outletId === id);
  if (!o) return;
  if (
    !confirm(
      'Delete "' +
        o.name +
        '"' +
        (prods.length ? " and its " + prods.length + " product" + (prods.length > 1 ? "s" : "") : "") +
        "?\n\nPast sales stay in your records and reports. Stock items are not deleted.",
    )
  )
    return;
  removeOutlet(id, prods)
    .then(() => toast("Deleted " + o.name))
    .catch((e) => toast("Could not delete: " + e.message));
  audit("delete", "Outlet " + o.name + " and " + prods.length + " products");
}
