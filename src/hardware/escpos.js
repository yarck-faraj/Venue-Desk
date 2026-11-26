import * as receipts from "../domain/receipts.js";
import { receiptData, money } from "../state/selectors.js";
import { PR } from "../state/persist.js";
import { METHODS, RECEIPT_ADDRESS, RECEIPT_PHONES } from "../config/constants.js";

export const escReceipt = (s, change, options = {}) =>
  receipts.escReceipt(s, change, options, {
    ...receiptData(s, change),
    cols: PR.cols(),
    money,
    address: RECEIPT_ADDRESS,
    phones: RECEIPT_PHONES,
    methods: METHODS,
    timestamp: new Date(s.ts).toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
