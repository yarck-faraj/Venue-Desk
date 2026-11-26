// Firestore documents can carry additional, historically optional fields.
// Fields used by calculations and privilege decisions are declared explicitly.
export interface FirestoreRow {
  id: string;
  [field: string]: any;
}
export interface Booking extends FirestoreRow {
  start: string;
  end: string;
  status: string;
  spaceIds?: string[];
  price?: number;
  crew?: { name?: string; role?: string; pay?: number }[];
}
export interface Stay extends FirestoreRow {
  checkIn: string;
  checkOut: string;
  status: string;
  roomIds?: string[];
  guestName?: string;
}
export interface Sale extends FirestoreRow {
  total: number;
  method: string;
  status: string;
  outletId: string;
  date: string;
  items?: CartItem[];
}
export interface CartItem {
  price: number;
  qty: number;
  [field: string]: any;
}
export interface Payment extends FirestoreRow {
  amount: number;
  method: string;
  type: string;
  bookingId?: string;
  stayId?: string;
  legacyKind?: string;
}
export type NamedRow = FirestoreRow & { name: string };
export type Room = NamedRow & { status?: string };
export type Shift = FirestoreRow & { staff: string; openedAt: number; closedAt?: number; float?: number };
export interface Collections {
  bookings: Booking[];
  clients: NamedRow[];
  vendors: NamedRow[];
  spaces: NamedRow[];
  outlets: NamedRow[];
  products: NamedRow[];
  stock: (NamedRow & { outletId: string; qty: number })[];
  stockCosts: (FirestoreRow & { cost?: number })[];
  crewPay: (FirestoreRow & { pay?: Record<string, number> })[];
  expenseCategories: NamedRow[];
  expenses: (FirestoreRow & { category: string; amount: number; bookingId?: string })[];
  sales: Sale[];
  shifts: Shift[];
  stays: Stay[];
  rooms: Room[];
  payments: Payment[];
  audit: (FirestoreRow & { action: string })[];
}
export interface SessionUser {
  uid: string;
  email: string | null;
}
export interface StaffSettings {
  ownerEmail: string;
  emails: string[];
  roles?: Record<string, string>;
  names?: Record<string, string>;
  outlets?: Record<string, string>;
}
export type Store = Collections & {
  venue: { name?: string; address?: string; currency?: string; dial?: string };
  oldSales: { cutoff?: Record<string, string> };
};
export interface PaperStatus {
  auto?: string;
  source: string;
  cutoff: string;
  lastDay: string;
}
export interface PaperSales {
  st: Record<string, PaperStatus>;
  list: Record<string, Sale[]>;
  busy: Record<string, boolean>;
  err: Record<string, string>;
  ent: string;
}
export interface UIState {
  tab: string;
  month: Date;
  day: string;
  spaceFilter: string;
  money: string;
  bookFilter: string;
  q: string;
  sub: string;
  detail: string | null;
  stayDetail: string | null;
  stayMode: string;
  stayStart: string;
  stayFilter: string;
  sq: string;
  peopleTab: string;
  period: string;
  rc: { s: Sale; change: number } | null;
  al: { range: string; from: string; to: string; staff: string; action: string; q: string };
  alLoading: boolean;
  alCapped: boolean;
  pos: { outlet: string; cat: string; cart: CartItem[]; q: string };
  ac?: AudioContext;
  cx?: string;
  cxPick?: string;
  diag?: [string, boolean, string][];
  ex?: { per: string; ym: string; cat: string; ent: string };
  migrated?: boolean;
  oh?: { per: string };
  old?: PaperSales;
  oldOpening?: boolean;
  olm?: PaperSaleForm | null;
  starting?: boolean;
  stq?: string;
  watchDay?: string;
}
export interface PaperSaleForm {
  ent: string;
  max: string;
  cutoff: string;
  mode: string;
  method: string;
  lines: CartItem[];
  date: string;
  vals: Record<string, string>;
  opts?: { key: string; name: string; price: number }[];
  busy: boolean;
  msg: string;
  err: string;
}
