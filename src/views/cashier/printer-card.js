import { PR, printerMode } from "../../state/persist.js";

export const printerCard =
  () => `<div class="cxcard"><h2 style="margin:0 0 6px">Receipt printer</h2><div class="cxchips" style="margin:6px 0">${[
    ["usb", "USB cable"],
    ["ble", "Bluetooth"],
    ["rawbt", "RawBT app"],
  ]
    .map(
      ([k, l]) =>
        `<button class="${printerMode() === k ? "on" : ""}" data-a="prMode" data-k="${k}">${l}</button>`,
    )
    .join("")}</div>
  <div class="cxrow"><span>Print after each sale</span><button class="cxlink" style="color:#3b2417" data-a="prAuto">${PR.auto() ? "On" : "Off"}</button></div>
  <div class="cxrow"><span>Characters per line</span><span><button class="cxlink" style="color:#3b2417" data-a="prCols" data-k="-1">−</button> <b>${PR.cols()}</b> <button class="cxlink" style="color:#3b2417" data-a="prCols" data-k="1">+</button></span></div>
  <button class="cxbtn" style="margin-top:12px" data-a="prTest">Print test receipt</button></div>`;
