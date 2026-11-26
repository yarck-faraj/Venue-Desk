import { PX } from "./transport.js";
import { rememberPrinter, usbProduct, usbVendor } from "../state/persist.js";

export async function usbOpen(ask) {
  if (!navigator.usb) throw new Error("This browser cannot use a USB printer");
  let d = PX.usb;
  if (!d) {
    const l = await navigator.usb.getDevices();
    d =
      l.find((x) => x.vendorId === usbVendor() && x.productId === usbProduct()) ||
      (ask ? await navigator.usb.requestDevice({ filters: [] }) : null);
  }
  if (!d) throw new Error("USB printer not connected");
  if (!d.opened) await d.open();
  if (!d.configuration) await d.selectConfiguration(1);
  let ifn = -1,
    ep = 0;
  d.configuration.interfaces.forEach((i) => {
    const e = i.alternates[0].endpoints.find((x) => x.direction === "out" && x.type === "bulk");
    if (e && ifn < 0) {
      ifn = i.interfaceNumber;
      ep = e.endpointNumber;
    }
  });
  if (ifn < 0) throw new Error("No printer found on that USB device");
  try {
    await d.claimInterface(ifn);
  } catch {
    /* already claimed */
  }
  rememberPrinter(d);
  PX.usb = d;
  PX.ep = ep;
  return d;
}

export async function usbSend(bytes) {
  const d = await usbOpen(true),
    u = new Uint8Array(bytes);
  for (let i = 0; i < u.length; i += 16384) await d.transferOut(PX.ep, u.slice(i, i + 16384));
}
