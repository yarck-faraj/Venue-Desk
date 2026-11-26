import { firebaseConfig, fs, initializeSdk } from "./sdk.js";

export function initFirebase() {
  const c = firebaseConfig();
  if (!c || !c.apiKey || /^PASTE/.test(c.apiKey)) return false;
  initializeSdk(c);

  fs.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  return true;
}
