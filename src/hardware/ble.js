import { PX } from "./transport.js";
import { BLE_SERVICES } from "../config/constants.js";

export async function bleOpen() {
  if (PX.ble && PX.ble.dev.gatt.connected) return PX.ble;
  if (!navigator.bluetooth) throw new Error("This browser cannot use a Bluetooth printer");
  const dev = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_SERVICES,
    }),
    srv = await dev.gatt.connect();
  let ch = null;
  for (const sv of await srv.getPrimaryServices())
    for (const c of await sv.getCharacteristics())
      if (!ch && (c.properties.write || c.properties.writeWithoutResponse)) ch = c;
  if (!ch) throw new Error("This printer's Bluetooth is not the low-energy kind. Use USB or the RawBT app.");
  return (PX.ble = { dev, ch });
}

export async function bleSend(bytes) {
  const { ch } = await bleOpen(),
    u = new Uint8Array(bytes);
  for (let i = 0; i < u.length; i += 100) {
    const part = u.slice(i, i + 100);
    await (ch.properties.writeWithoutResponse ? ch.writeValueWithoutResponse(part) : ch.writeValue(part));
    await new Promise((r) => setTimeout(r, 20));
  }
}
