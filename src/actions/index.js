import { navActions } from "./nav.js";
import { authActions } from "./auth.js";
import { adminActions } from "./admin.js";
import { posActions } from "./pos.js";
import { bookingsActions } from "./bookings.js";
import { moneyActions } from "./money.js";
import { printingActions } from "./printing.js";
import { staffActions } from "./staff.js";
import { stockActions } from "./stock.js";
import { staysActions } from "./stays.js";
import { oldSalesActions } from "./old-sales.js";

export const A = {
  ...navActions,
  ...authActions,
  ...adminActions,
  ...posActions,
  ...bookingsActions,
  ...moneyActions,
  ...printingActions,
  ...staffActions,
  ...stockActions,
  ...staysActions,
  ...oldSalesActions,
};
