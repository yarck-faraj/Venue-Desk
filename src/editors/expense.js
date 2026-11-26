import { byId, cur, expCats } from "../state/selectors.js";
import { form } from "../components/form.js";
import { S } from "../state/store.js";
import { live } from "../domain/bookings.js";
import { fmtDay, today } from "../domain/dates.js";
import { del, save } from "../firebase/writes.js";
import { isOwner } from "../state/session.js";

export function editExpense(id, bookingId) {
  const e = id ? byId("expenses", id) : null;
  form(
    e ? "Edit expense" : "Add expense",
    [
      { k: "date", label: "Date", type: "date" },
      { k: "amount", label: `Amount (${cur()})`, type: "number", step: "0.01", req: true },
      {
        k: "category",
        label: "What was it for? Type a new one or pick a saved one",
        type: "combo",
        req: true,
        ph: "e.g. Water",
        opts: expCats(),
      },
      {
        k: "entity",
        label: "Which part of Lynn's",
        type: "select",
        opts: [
          ["", "Shared / whole center"],
          ["center", "Event center"],
          ...S.outlets.map((o) => [o.id, o.name]),
        ],
      },
      {
        k: "vendorId",
        label: "Vendor (optional)",
        type: "select",
        opts: [["", "—"], ...S.vendors.map((v) => [v.id, v.name])],
      },
      {
        k: "bookingId",
        label: "For event (optional)",
        type: "select",
        opts: [
          ["", "General / overhead"],
          ...S.bookings
            .filter(live)
            .sort((a, b) => b.start.localeCompare(a.start))
            .map((b) => [b.id, b.title + " · " + fmtDay(b.start)]),
        ],
      },
      { k: "note", label: "Description" },
    ],
    e || { date: today(), entity: "", bookingId: bookingId || "" },
    {
      onSave(o) {
        o.category = expCats().find((c) => c.toLowerCase() === o.category.toLowerCase()) || o.category;
        if (!(S.expenseCategories || []).some((c) => c.name.toLowerCase() === o.category.toLowerCase()))
          save("expenseCategories", null, { name: o.category });
        save("expenses", id, o);
      },
      onDelete: e && isOwner() ? () => del("expenses", id) : null,
    },
  );
}
