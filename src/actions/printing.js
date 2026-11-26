import { adjustColumns, setPrinterMode, toggleAutoPrint } from "../state/persist.js";
import { render } from "../app/render.js";
import { bleOpen } from "../hardware/ble.js";
import { thermalPrint } from "../hardware/printer.js";
import { usbOpen } from "../hardware/usb.js";
import { toast } from "../components/toast.js";
import { me, myOutlet } from "../state/session.js";
import { invoice } from "../print/invoice.js";
import { printReceiptAction } from "../print/receipt-popup.js";
import { shareReceiptAction, stayWhatsapp, whatsapp } from "../print/whatsapp.js";
import { stayInvoice } from "../print/guest-bill.js";

export const printingActions = {
  prMode: (d) => {
    setPrinterMode(d.k);
    render();
    if (d.k === "usb")
      usbOpen(true)
        .then(() => toast("USB printer connected"))
        .catch((e) => {
          if (!e || e.name !== "NotFoundError") toast(String((e && e.message) || e).slice(0, 110));
        });
    if (d.k === "ble")
      bleOpen()
        .then(() => toast("Bluetooth printer connected"))
        .catch((e) => {
          if (!e || e.name !== "NotFoundError") toast(String((e && e.message) || e).slice(0, 110));
        });
  },
  prAuto: () => {
    toggleAutoPrint();
    render();
  },
  prCols: (d) => {
    adjustColumns(+d.k);
    render();
  },
  prTest: () =>
    thermalPrint(
      {
        no: "TEST",
        ts: Date.now(),
        staff: me.email,
        outletId: myOutlet(),
        status: "paid",
        method: "cash",
        tendered: 100,
        total: 64,
        items: [
          { name: "Americano · Medium", qty: 1, price: 40 },
          { name: "Meat Pie", qty: 2, price: 12 },
        ],
      },
      36,
      { ruler: true },
    ),
  printReceipt: printReceiptAction,
  shareReceipt: shareReceiptAction,
  stayInvoice: (d) => stayInvoice(d.id),
  stayWa: (d) => stayWhatsapp(d.id),
  invoice: (d) => invoice(d.id),
  wa: (d) => whatsapp(d.id),
};
