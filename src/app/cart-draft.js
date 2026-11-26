import { render } from "./render.js";
import { toast } from "../components/toast.js";
import { readDraft, writeDraft } from "../state/cart-draft.js";
import { isTill, me, myOutlet } from "../state/session.js";
import { ui } from "../state/store.js";
import { $ } from "../utils/dom.js";

let active;

export function closeCart() {
  active = null;
  ui.pos.cart = [];
  $("#view").removeAttribute("aria-busy");
}

// Each operation uses the displayed till session, even if an account switches
// while IndexedDB is working. Queue rapid taps in the order they arrived.
export function withCurrentCart(action) {
  const session = active;
  if (!session) return Promise.resolve(null);
  $("#view").setAttribute("aria-busy", "true");
  const task = session.queue.then(() => (active === session ? action() : null));
  session.queue = task.catch(() => {});
  const tail = session.queue;
  return task.finally(() => {
    if (active === session && session.queue === tail) $("#view").removeAttribute("aria-busy");
  });
}

export function openCart() {
  closeCart();
  if (!isTill()) return;
  const account = me.uid || me.email,
    outlet = myOutlet();
  if (!account || !outlet) return;
  const session = { account, outlet, revision: 0, queue: Promise.resolve() };
  active = session;
  withCurrentCart(async () => {
    try {
      const draft = await readDraft(account, outlet);
      if (active !== session) return;
      session.revision = draft.revision;
      ui.pos.cart = draft.cart;
      render();
    } catch {
      if (active === session)
        toast("Could not read the saved cart. Check the sale against your paper ticket.");
    }
  });
}

export async function saveCart(cart) {
  const session = active;
  if (!session) return false;
  const previous = ui.pos.cart;
  try {
    const { saved, draft } = await writeDraft(session.account, session.outlet, session.revision, cart);
    if (active !== session) {
      // A checkout that lost its session cannot submit. Preserve its old draft
      // unless a newer operation already changed it.
      if (saved && !cart.length && previous.length)
        await writeDraft(session.account, session.outlet, draft.revision, previous);
      return false;
    }
    session.revision = draft.revision;
    ui.pos.cart = draft.cart;
    if (!saved) {
      render();
      toast("The saved cart changed in another tab. Review it before continuing.");
    }
    return saved;
  } catch {
    if (active === session)
      toast("Could not save the cart on this device. The change was not applied. Keep a paper ticket.");
    return false;
  }
}
