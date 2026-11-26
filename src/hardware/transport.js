import { printerMode } from "../state/persist.js";

/* ---------- thermal printing: raw ESC/POS handed to the RawBT app, which talks to the Bluetooth printer ---------- */
export const PX = { usb: null, ep: 0, ble: null, mode: printerMode };
