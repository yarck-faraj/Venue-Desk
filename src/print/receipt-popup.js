import { role } from "../state/session.js";
import { thermalPrint } from "../hardware/printer.js";
import { ui } from "../state/store.js";
import { toast } from "../components/toast.js";
import { receiptInner } from "../actions/receipts.js";

export const printReceiptAction = () => {
  if (role() === "cashier") return thermalPrint(ui.rc.s, ui.rc.change, {});
  const w = window.open("", "_blank");
  if (!w) return toast("Allow pop-ups to print");
  w.document.write(
    `<!doctype html><title>Receipt</title><style>@page{size:80mm auto;margin:0}body{font:13px/1.35 system-ui;width:72mm;margin:0 auto;padding:4mm 0}.s{color:#444;font-size:11px}</style>${receiptInner(ui.rc.s, ui.rc.change)}<script>setTimeout(()=>print(),300)<\/script>`,
  );
  w.document.close();
};
