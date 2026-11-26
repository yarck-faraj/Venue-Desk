/** @param {number} n */
export const p2 = (n) => String(n).padStart(2, "0");

/** @param {Date} d */
export const isoDay = (d) => d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());

/** @param {() => Date} [clock] */
export const today = (clock = () => new Date()) => isoDay(clock());

/** @param {string} s @param {string} [locale] */
export const fmtDay = (s, locale) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** @param {string} s */
export const fmtTime = (s) => {
  const [h, m] = s.slice(11, 16).split(":").map(Number);
  return ((h + 11) % 12) + 1 + (m ? ":" + p2(m) : "") + (h < 12 ? "am" : "pm");
};

/** @param {{start: string, end: string}} b @param {string} [locale] */
export const fmtRange = (b, locale) =>
  b.start.slice(0, 10) === b.end.slice(0, 10)
    ? fmtDay(b.start, locale) + ", " + fmtTime(b.start) + " – " + fmtTime(b.end)
    : fmtDay(b.start, locale) + " " + fmtTime(b.start) + " → " + fmtDay(b.end, locale) + " " + fmtTime(b.end);

/** @param {string} s */
export const ymd = (s) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** @param {string} a @param {string} b */
export const dayDiff = (a, b) => Math.round((ymd(b) - ymd(a)) / 864e5);

/** @param {string} s @param {number} n */
export const addDays = (s, n) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return isoDay(new Date(y, m - 1, d + n));
};

/** @param {string} d */
export const isWkEnd = (d) => {
  const g = new Date(ymd(d) + 12 * 36e5).getUTCDay();
  return g === 0 || g === 6;
};

/** @param {string} k @param {string[]} months */
export const monthLabel = (k, months) => (months[+k.slice(5) - 1] || k) + " " + k.slice(0, 4);
