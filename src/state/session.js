/** @type {import("./models.js").SessionUser | null} */
export let me = null;
/** @type {import("./models.js").StaffSettings | null} */
export let staff = null;

/** @param {import("./models.js").SessionUser | null} user */
export function setUser(user) {
  me = user;
}

/** @param {import("./models.js").StaffSettings | null} settings */
export function setStaff(settings) {
  staff = settings;
}

export const isOwner = () => !!(me && staff && staff.ownerEmail === (me.email || "").toLowerCase());
export const role = () =>
  !me || !staff ? "" : isOwner() ? "owner" : (staff.roles || {})[(me.email || "").toLowerCase()] || "none";
export const canManage = () => role() === "owner" || role() === "manager";
export const isTill = () => role() === "cashier";
export const myOutlet = () =>
  me && staff ? (staff.outlets || {})[(me.email || "").toLowerCase()] || "" : "";
export const myEmail = () => {
  const user = /** @type {import("./models.js").SessionUser} */ (me);
  return (user.email || "").toLowerCase();
};
