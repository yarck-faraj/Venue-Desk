/** @param {unknown} v */
export const num = (v) => Number(v) || 0;

/** @param {unknown} n */
export const fq = (n) => num(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

/** @param {unknown} n @param {string} currency */
export const money = (n, currency) =>
  (num(n) < 0 ? "-" : "") +
  currency +
  Math.abs(num(n)).toLocaleString(undefined, { maximumFractionDigits: 2 });
