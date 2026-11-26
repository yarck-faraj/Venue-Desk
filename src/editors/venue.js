import { form } from "../components/form.js";
import { S } from "../state/store.js";
import { saveVenue } from "../firebase/writes.js";

export function editVenue() {
  form(
    "Venue settings",
    [
      { k: "name", label: "Venue name", req: true },
      { k: "currency", label: "Currency symbol", def: "GH₵" },
      { k: "dial", label: "Phone country code (for WhatsApp)", def: "233" },
      { k: "address", label: "Address / contact line (shown on invoices)" },
    ],
    S.venue,
    {
      onSave(o) {
        saveVenue(o);
      },
    },
  );
}
