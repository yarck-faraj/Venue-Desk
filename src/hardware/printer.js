import { escReceipt } from "./escpos.js";
import { PX } from "./transport.js";
import { usbSend } from "./usb.js";
import { bleSend } from "./ble.js";
import { rawbtSend } from "./rawbt.js";
import { toast } from "../components/toast.js";

export async function thermalPrint(s, change, o) {
  const bytes = escReceipt(s, change, o),
    m = PX.mode();
  try {
    if (m === "usb") await usbSend(bytes);
    else if (m === "ble") await bleSend(bytes);
    else rawbtSend(bytes);
  } catch (e) {
    if (!e || e.name !== "NotFoundError")
      toast("Printing failed: " + String((e && e.message) || e).slice(0, 110));
  }
}
