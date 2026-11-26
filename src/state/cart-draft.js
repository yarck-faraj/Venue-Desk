/** @typedef {import("./models.js").CartItem} CartItem */
/** @typedef {{cart: CartItem[], revision: number}} Draft */

/** @returns {Promise<IDBDatabase>} */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("venuedesk-cashier-drafts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** @param {string} account @param {string} outlet @returns {Draft} */
function legacyDraft(account, outlet) {
  const raw = localStorage.getItem("vd-cart-" + account);
  if (!raw) return { cart: [], revision: 0 };
  const record = JSON.parse(raw);
  if (!Array.isArray(record?.cart)) throw new Error("Invalid saved cart");
  /** @type {CartItem[]} */
  const lines = record.cart;
  const cart = lines.filter((item) => item?.outletId === outlet);
  if (
    cart.some(
      (item) =>
        typeof item.pid !== "string" ||
        typeof item.name !== "string" ||
        !Number.isFinite(item.price) ||
        !Number.isSafeInteger(item.qty) ||
        item.qty <= 0 ||
        (item.per != null && (!Number.isFinite(item.per) || item.per <= 0)),
    )
  )
    throw new Error("Invalid saved cart line");
  return { cart, revision: 0 };
}

/** @param {string} account @param {string} outlet @returns {Promise<Draft>} */
export async function readDraft(account, outlet) {
  const db = await openDatabase();
  try {
    const stored = await new Promise((resolve, reject) => {
      const request = db.transaction("drafts").objectStore("drafts").get([account, outlet]);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return stored ?? legacyDraft(account, outlet);
  } finally {
    db.close();
  }
}

/** Compare and replace inside one transaction, including empty carts so an old draft cannot reappear.
 * @param {string} account @param {string} outlet @param {number} revision @param {CartItem[]} cart
 * @returns {Promise<{saved: boolean, draft: Draft}>} */
export async function writeDraft(account, outlet, revision, cart) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite", { durability: "strict" });
      const store = tx.objectStore("drafts");
      const key = [account, outlet];
      const read = store.get(key);
      let result = { saved: true, draft: { revision: revision + 1, cart } };
      read.onsuccess = () => {
        if ((read.result?.revision ?? 0) !== revision) {
          result = { saved: false, draft: read.result };
        } else {
          store.put(result.draft, key);
        }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(tx.error ?? new Error("Cart save interrupted"));
    });
  } finally {
    db.close();
  }
}
