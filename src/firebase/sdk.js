import { REGION } from "../config/constants.js";
/* ---------- business logic ---------- */

/* ---------- data layer (Firestore) ---------- */
export let fs, auth;

export const firebaseConfig = () => window.VD_FIREBASE;

export function initializeSdk(config) {
  firebase.initializeApp(config);
  auth = firebase.auth();
  fs = firebase.firestore();
}

export const createStaffApp = () => firebase.initializeApp(firebase.app().options, "acct" + Date.now());

export const callable = (name) =>
  firebase
    .app()
    .functions(window.VD_REGION || REGION)
    .httpsCallable(name);

export const FV = () => firebase.firestore.FieldValue;
