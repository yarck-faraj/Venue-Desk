import { staff } from "../state/session.js";
import { form } from "../components/form.js";
import { resetStaffPassword } from "../firebase/callables.js";
import { toast } from "../components/toast.js";
import { S } from "../state/store.js";
import { loginId } from "../state/selectors.js";
import { makeAccount } from "../firebase/auth.js";
import { updateStaff } from "../firebase/writes.js";
import { audit } from "../firebase/audit.js";

export function resetPw(email) {
  const nm = (staff.names || {})[email] || email;
  form(
    "New password for " + nm,
    [{ k: "pw", label: "New password (min 6 characters)", req: true }],
    {},
    {
      validate: (o) => (String(o.pw || "").length < 6 ? "Password needs at least 6 characters." : ""),
      async onSave(o) {
        const pw = String(o.pw || "");
        try {
          await resetStaffPassword(email, pw);
          toast("Password changed. " + nm + " is signed out and can log in with the new one.");
        } catch (x) {
          const m = String((x && x.message) || x);
          alert(
            /not-found|NOT_FOUND/i.test(m) && /function/i.test(m)
              ? "The reset function is not deployed yet. Run: firebase deploy --only functions"
              : "Could not reset the password: " + m,
          );
        }
      },
    },
  );
}

export function editStaff(email) {
  const roles = staff.roles || {},
    edit = !!email,
    nm = (staff.names || {})[email] || email;
  const outOpts = [["", "— none —"], ...S.outlets.map((o) => [o.id, o.name])];
  form(
    edit ? "Staff: " + nm : "Add staff",
    [
      ...(edit
        ? []
        : [
            { k: "login", label: "Name or email they will sign in with", req: true, ph: "e.g. Ama" },
            { k: "pw", label: "Password (min 6 characters)", req: true },
          ]),
      {
        k: "role",
        label: "Role",
        type: "select",
        opts: [
          ["cashier", "Cashier (one bar only)"],
          ["manager", "Event center manager"],
        ],
      },
      { k: "outletId", label: "Cashier's bar", type: "select", opts: outOpts },
    ],
    { role: roles[email] || "cashier", outletId: (staff.outlets || {})[email] || "" },
    {
      async onSave(o) {
        if (o.role === "cashier" && !o.outletId) return toast("Choose which bar this cashier works at");
        let em = email,
          label = (staff.names || {})[email] || "";
        if (!edit) {
          if ((o.pw || "").length < 6) return toast("Password needs at least 6 characters");
          em = loginId(o.login);
          label = o.login.includes("@") ? "" : o.login.trim();
          try {
            await makeAccount(em, o.pw);
          } catch (x) {
            if (x.code !== "auth/email-already-in-use") return alert(x.message);
          }
        }
        if (em === staff.ownerEmail) return toast("The owner's role cannot be changed here");
        const upd = {
          emails: [...new Set([...staff.emails, em])],
          roles: { ...roles, [em]: o.role },
          outlets: { ...(staff.outlets || {}), [em]: o.role === "cashier" ? o.outletId : "" },
        };
        if (label) upd.names = { ...(staff.names || {}), [em]: label };
        updateStaff(upd)
          .then(() => toast(edit ? "Staff updated" : "Staff added"))
          .catch((x) => alert(x.message));
        audit(
          "staff",
          (edit ? "Changed " : "Added ") + em + " → " + o.role + (o.outletId ? " @ " + o.outletId : ""),
        );
      },
      delText: "Remove access",
      delConfirm: "Remove " + nm + "'s access? They will be locked out of the app straight away.",
      onDelete: edit
        ? () => {
            const nr = { ...roles },
              no = { ...(staff.outlets || {}) },
              nn = { ...(staff.names || {}) };
            delete nr[email];
            delete no[email];
            delete nn[email];
            updateStaff({
              emails: staff.emails.filter((x) => x !== email),
              roles: nr,
              outlets: no,
              names: nn,
            })
              .then(() => toast("Access removed"))
              .catch((x) => alert(x.message));
            audit("staff", "Removed access: " + email);
          }
        : null,
    },
  );
}
