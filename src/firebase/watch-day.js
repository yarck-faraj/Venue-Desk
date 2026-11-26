import { ui } from "../state/store.js";
import { today } from "../domain/dates.js";
import { stopWatch, watchAll } from "./listeners.js";

export function refreshWatchDay() {
  if (ui.watchDay && ui.watchDay !== today()) {
    stopWatch();
    watchAll();
  }
}
