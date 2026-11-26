/** @type {Array<() => void>} */
let sessionListeners = [];
/** @type {Array<() => void>} */
let dataListeners = [];
/** @type {string | null} */
let watchedRole = null;

/** @param {() => void} unsubscribe */
export function trackSessionListener(unsubscribe) {
  sessionListeners.push(unsubscribe);
}

/** @param {() => void} unsubscribe */
export function trackDataListener(unsubscribe) {
  dataListeners.push(unsubscribe);
}

export function stopSessionListeners() {
  sessionListeners.forEach((unsubscribe) => unsubscribe());
  sessionListeners = [];
}

export function stopDataListeners() {
  dataListeners.forEach((unsubscribe) => unsubscribe());
  dataListeners = [];
  watchedRole = null;
}

export const hasDataListeners = () => watchedRole !== null;
/** @param {string} role */
export const isWatchingRole = (role) => watchedRole !== null && watchedRole === role;

/** @param {string} role */
export function setWatchedRole(role) {
  watchedRole = role;
}
