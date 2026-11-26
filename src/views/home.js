import { isOwner } from "../state/session.js";
import { vOwnerHome } from "./owner/home.js";
import { vManagerHome } from "./manager/home.js";

export function vHome() {
  return isOwner() ? vOwnerHome() : vManagerHome();
}
