import { auth, createStaffApp, fs } from "./sdk.js";
import { $, esc } from "../utils/dom.js";
import { loginId } from "../state/selectors.js";
import { isOwner, me, myOutlet, role, setStaff, setUser, staff } from "../state/session.js";
import { stopWatch, watchAll } from "./listeners.js";
import {
  hasDataListeners,
  isWatchingRole,
  setWatchedRole,
  stopSessionListeners,
  trackSessionListener,
} from "../state/subscriptions.js";
import { ui } from "../state/store.js";
import { closeCart, openCart } from "../app/cart-draft.js";
import { closeModal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { render } from "../app/render.js";

/* ---------- auth ---------- */
export async function makeAccount(em, pw) {
  // owner creates a staff login without being signed out
  const app2 = createStaffApp();
  try {
    await app2.auth().createUserWithEmailAndPassword(em, pw);
    await app2.auth().signOut();
  } finally {
    await app2.delete();
  }
}

function showAuth(which) {
  closeCart();
  closeModal();
  $("#auth").hidden = false;
  $("#app").hidden = true;
  $("#authForm").hidden = which !== "form";
  $("#authGate").hidden = which === "form";
}

export async function doAuth(kind) {
  const raw = $("#em").value.trim(),
    em = loginId(raw),
    pw = $("#pw").value;
  $("#authErr").textContent = "";
  try {
    if (kind === "reset") {
      if (!raw.includes("@"))
        throw new Error(
          "Password resets by email only work for email logins. If you sign in with a name, ask the owner.",
        );
      await auth.sendPasswordResetEmail(em);
      $("#authErr").textContent = "Password reset email sent.";
      return;
    }
    if (kind === "signup") {
      if (!raw.includes("@")) throw new Error("Staff accounts are created by the owner.");
      await auth.createUserWithEmailAndPassword(em, pw);
    } else await auth.signInWithEmailAndPassword(em, pw);
  } catch (e) {
    $("#authErr").textContent = e.message.replace("Firebase: ", "");
  }
}

function gate() {
  const email = (me.email || "").toLowerCase();
  const g = $("#authGate");
  if (!staff) {
    stopWatch();
    showAuth("gate");
    g.innerHTML = `<p>This venue has no owner yet. The first person to set up becomes the owner and can then add staff.</p>
      <button class="btn" style="width:100%" data-a="claimOwner">Set up ${esc(email)} as owner</button>
      <p style="margin-top:12px"><button class="btn alt sm" data-a="signout">Sign out</button></p>`;
  } else if (!staff.emails.includes(email)) {
    showAuth("gate");
    stopWatch();
    g.innerHTML = `<p>${esc(email)} does not have access. Ask the owner to add this email under More &gt; Staff access.</p><button class="btn alt" data-a="signout">Sign out</button>`;
  } else if (role() === "none" || (role() === "cashier" && !myOutlet())) {
    showAuth("gate");
    stopWatch();
    g.innerHTML = `<p>Your access is not fully set up yet. Ask the owner to give you a role (and a bar, if you are a cashier).</p><button class="btn alt" data-a="signout">Sign out</button>`;
  } else {
    $("#auth").hidden = true;
    $("#app").hidden = false;
    const r = role();
    const scope = r === "cashier" ? JSON.stringify([r, myOutlet()]) : r;
    if (!isWatchingRole(scope)) {
      const first = !hasDataListeners();
      stopWatch();
      setWatchedRole(scope);
      closeModal();
      ui.sub = "";
      ui.detail = null;
      ui.stayDetail = null;
      if (r === "cashier") ui.tab = "pos";
      ui.money = isOwner() ? "overview" : "payments";
      openCart();
      watchAll();
      if (!first) toast("Your access was changed to: " + r);
    }
    render();
  }
}

export function startAuth(scanClose) {
  auth.onAuthStateChanged((u) => {
    scanClose();
    stopSessionListeners();
    stopWatch();
    setStaff(null);
    setUser(u);
    closeCart();
    closeModal();
    if (!u) {
      showAuth("form");
      return;
    }
    trackSessionListener(
      fs.doc("settings/staff").onSnapshot(
        (s) => {
          setStaff(s.exists ? s.data() : null);
          gate();
        },
        (e) => {
          console.error(e);
          stopWatch();
          showAuth("gate");
          const g = $("#authGate");
          g.innerHTML = `<p>Could not load staff access: ${esc(e.code || "error")}. Check this device's internet connection, then try again.</p>
            <button class="btn" style="width:100%" onclick="location.reload()">Try again</button>
            <p style="margin-top:12px"><button class="btn alt sm" data-a="signout">Sign out</button></p>`;
        },
      ),
    );
  });
}

export function claimOwner() {
  const e = me.email.toLowerCase();
  fs.doc("settings/staff")
    .set({ ownerEmail: e, emails: [e], roles: {} })
    .then(() =>
      fs
        .doc("settings/venue")
        .set({ name: "Lynn's Event Center", address: "Dawhenya", currency: "GH₵", dial: "233" }),
    )
    .catch((x) => alert(x.message));
}

export function signOut() {
  return auth.signOut();
}
