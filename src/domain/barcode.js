/** @param {unknown} c */
export const bcKey = (c) =>
  String(c == null ? "" : c)
    .trim()
    .replace(/^0+(?=\d)/, ""); // UPC-A and EAN-13 versions of one code compare equal
