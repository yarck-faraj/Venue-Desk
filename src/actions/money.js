import { editPayment } from "../editors/payment.js";
import { byId } from "../state/selectors.js";
import { toast } from "../components/toast.js";
import { isOwner } from "../state/session.js";
import { editExpense } from "../editors/expense.js";

export const moneyActions = {
  newPayment: (d) => editPayment(null, d.id),
  editPayment: (d) => {
    const p = byId("payments", d.id);
    if (p && p.legacy)
      return toast("Old paper records are managed under " + (isOwner() ? "More > Old sales" : "Old sales"));
    editPayment(d.id);
  },
  newExpense: (d) => editExpense(null, d.id),
  editExpense: (d) => editExpense(d.id),
  stayPay: (d) => editPayment(null, null, d.id),
};
