/** @typedef {{ "#mf":HTMLFormElement, "#pw":HTMLInputElement, "#em":HTMLInputElement, "#pq":HTMLInputElement, "#restoreFile":HTMLInputElement }} KnownControls */
/** @template {string} K @param {K} s @returns {(K extends keyof KnownControls ? KnownControls[K] : HTMLElement) | null} */
export const $ = (s) =>
  /** @type {(K extends keyof KnownControls ? KnownControls[K] : HTMLElement) | null} */ (
    document.querySelector(s)
  );
/** @param {unknown} s */
export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
  );
