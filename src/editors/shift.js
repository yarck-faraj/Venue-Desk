import { form } from "../components/form.js";
import { cur, money, shiftStats } from "../state/selectors.js";
import { save, saveLocal } from "../firebase/writes.js";
import { myEmail, myOutlet } from "../state/session.js";
import { today } from "../domain/dates.js";
import { num } from "../domain/money.js";
import { myShift } from "../state/shift.js";
import { toast } from "../components/toast.js";
import { audit } from "../firebase/audit.js";

export function openShift() {
  form(
    "Open shift",
    [{ k: "float", label: `Cash in the till now (${cur()})`, type: "number", step: "0.01" }],
    { float: 0 },
    {
      onSave(o) {
        save("shifts", null, {
          staff: myEmail(),
          openedAt: Date.now(),
          date: today(),
          outletId: myOutlet(),
          float: num(o.float),
          closedAt: 0,
        });
      },
    },
  );
}

export function closeShift() {
  const sh = myShift();
  if (!sh) return;
  const st = shiftStats(sh);
  form(
    "Close shift",
    [
      {
        k: "counted",
        label: `Cash counted in the till (${cur()}). Expected ${money(st.expected)}`,
        type: "number",
        step: "0.01",
        req: true,
      },
      { k: "note", label: "Note" },
    ],
    {},
    {
      onSave(o) {
        const d = num(o.counted) - st.expected;
        saveLocal("shifts", sh.id, {
          closedAt: Date.now(),
          counted: num(o.counted),
          expected: st.expected,
          diff: Math.round(d * 100) / 100,
          note: o.note,
          totals: st.by,
        });
        toast(Math.abs(d) < 0.005 ? "Till balanced" : "Difference: " + money(d));
        if (Math.abs(d) > 0.005)
          audit(
            "till difference",
            money(d) + " (expected " + money(st.expected) + ", counted " + money(num(o.counted)) + ")",
          );
      },
    },
  );
}
