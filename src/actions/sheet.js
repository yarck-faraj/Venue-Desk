import { ui } from "../state/store.js";
import { render } from "../app/render.js";

export const closeSheet = () => {
  ui.detail = null;
  ui.stayDetail = null;
  render();
};
