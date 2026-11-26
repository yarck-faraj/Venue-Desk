/** @param {unknown} t */
export function parseCrew(t) {
  return String(t || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, role, pay] = l.split(",").map((x) => x.trim());
      return { name: name || "", role: role || "", pay: Number(pay) || 0 };
    });
}

/** @param {unknown} t */
export const parseSizes = (t) =>
  String(t || "")
    .split("\n")
    .map((l) => l.split(",").map((x) => x.trim()))
    .filter((a) => a[0] && (Number(a[1]) || 0) > 0)
    .map((a) => ({ size: a[0], price: Number(a[1]) || 0, ...(a[2] ? { volume: a[2] } : {}) }));

/** @param {unknown} value @param {string} domain */
export const loginId = (value, domain) => {
  const v = String(value || "").trim();
  return v.includes("@") ? v.toLowerCase() : v.toLowerCase().replace(/[^a-z0-9]/g, "") + domain;
};
