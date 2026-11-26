import { claimOwner, doAuth, signOut } from "../firebase/auth.js";

export const authActions = {
  signin: () => doAuth("signin"),
  signup: () => doAuth("signup"),
  reset: () => doAuth("reset"),
  signout: signOut,
  claimOwner,
};
