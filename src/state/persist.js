export const lastBackup = () => {
  try {
    return localStorage.getItem("vd-last-backup") || "";
  } catch {
    return "";
  }
};
export const PR = {
  cols: () => Math.min(56, Math.max(30, Number(localStorage.getItem("prCols")) || 42)),
  auto: () => localStorage.getItem("prAuto") !== "0",
};

export function recordBackup() {
  try {
    localStorage.setItem("vd-last-backup", new Date().toISOString());
  } catch {}
}

export const printerMode = () => localStorage.getItem("prMode") || "rawbt";
/** @param {string} mode */
export const setPrinterMode = (mode) => localStorage.setItem("prMode", mode);
export const toggleAutoPrint = () => localStorage.setItem("prAuto", PR.auto() ? "0" : "1");
/** @param {number} delta */
export const adjustColumns = (delta) => localStorage.setItem("prCols", String(PR.cols() + delta));
export const usbVendor = () => Number(localStorage.getItem("prUsbV"));
export const usbProduct = () => Number(localStorage.getItem("prUsbP"));

/** @param {{vendorId:number,productId:number}} device */
export function rememberPrinter(device) {
  localStorage.setItem("prUsbV", String(device.vendorId));
  localStorage.setItem("prUsbP", String(device.productId));
}
