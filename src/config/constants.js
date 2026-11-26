export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const PALETTE = [
  "#1F3A34",
  "#C8902E",
  "#6b4fa0",
  "#2f6fa8",
  "#b3392f",
  "#4a8a5c",
  "#8a5a44",
  "#c05c8a",
];
export const DEFAULT_CHECKLIST = [
  "Contract signed",
  "Deposit received",
  "Menu / caterer confirmed",
  "Decor and seating plan",
  "Sound / AV tested",
  "Final headcount",
  "Final balance paid",
  "Post-event cleanup",
];
export const EXP_SEED = ["Light", "Water", "Cleaning", "Laundry"];
/** @type {Record<string, string>} */
export const METHODS = {
  cash: "Cash",
  momo: "Mobile money",
  card: "Card",
  booking: "Charged to event",
  room: "Charged to room",
  tab: "Open tab",
};
export const DIAG_READ = [
  "settings",
  "outlets",
  "bookings",
  "spaces",
  "rooms",
  "stays",
  "clients",
  "payments",
  "products",
  "stock",
  "stockCosts",
  "sales",
  "shifts",
  "expenses",
  "expenseCategories",
  "vendors",
  "crewPay",
  "stockMoves",
  "audit",
];
/** @type {Record<string, string>} */
export const OUTLET_CODE = { coffee: "GB", cocktail: "CT", bites: "BT" };
export const RECEIPT_PHONES = "050 009 2572 / 053 938 1128 / 055 571 3138";
/** @type {Record<string, string>} */
export const OUTLET_TAGLINE = { bites: "A healthy morning, a happy life" };
export const STAFF_DOMAIN = "@staff.lynns.invalid";
/** @type {Record<string, string>} */
export const STATE_LABEL = {
  occupied: "Occupied",
  maintenance: "Maintenance",
  dirty: "Needs cleaning",
  arriving: "Arriving",
  vacant: "Vacant · clean",
};
export const BK_COLLS = [
  "bookings",
  "clients",
  "vendors",
  "spaces",
  "payments",
  "expenses",
  "expenseCategories",
  "outlets",
  "products",
  "stock",
  "stockCosts",
  "crewPay",
  "stockMoves",
  "sales",
  "shifts",
  "rooms",
  "stays",
  "audit",
];
export const RECEIPT_ADDRESS = "Community 25, Tema";
export const BLE_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
];
export const SCAN_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];
/** @type {Record<string, string>} */
export const OLD_KIND = { hall: "Hall or event", room: "Room stay", other: "Other" };
/** @type {Record<string, string>} */
export const OLD_METHODS = {
  cash: "Cash",
  momo: "Mobile money",
  card: "Card",
  bank: "Bank transfer",
  cheque: "Cheque",
};

export const REGION = "europe-west1";
export const AUDIT_TTL_DAYS = 730;
export const OLD_BAR_METHODS = ["cash", "momo", "card"];
export const OLD_CENTER_METHODS = ["cash", "momo", "bank", "card", "cheque"];
