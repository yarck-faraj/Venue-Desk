import { bcKey } from "../domain/barcode.js";
import { S, ui } from "../state/store.js";
import { myOutlet } from "../state/session.js";
import { render } from "../app/render.js";
import { addCartItem } from "../actions/cart-item.js";
import { $ } from "../utils/dom.js";
import { toast } from "../components/toast.js";
import { SCAN_FORMATS } from "../config/constants.js";
import { money } from "../state/selectors.js";

/* ---------- camera barcode scanner (cashier till) ----------
   Uses the browser's own BarcodeDetector when it exists (Chrome on Android), otherwise the bundled ZXing decoder (zxing.min.js, loaded on first use).
   The scanner sits in its own element outside #view, because the till screen is redrawn often and would kill the video. */
const prodByBarcode = (code) => {
  const k = bcKey(code);
  return k ? S.products.find((p) => p.outletId === myOutlet() && bcKey(p.barcode) === k) || null : null;
};

export async function scanItem(code) {
  // put the product with this barcode on the sale (or open its size list); returns {p, ok, sized} or null. ok=false when stock is zero
  const p = prodByBarcode(code);
  if (!p) return null;
  if ((p.variations || []).length) {
    ui.cxPick = p.id;
    render();
    return { p, ok: true, sized: true };
  }
  const added = await addCartItem({ id: p.id });
  return { p, ok: added === true, storageIssue: added == null, sized: false };
}

const SC = {
  on: false,
  stream: null,
  timer: 0,
  det: null,
  zx: null,
  canvas: null,
  video: null,
  last: "",
  lastAt: 0,
  n: 0,
};

function scanBeep(ok) {
  try {
    const c = ui.ac || (ui.ac = new (window.AudioContext || window.webkitAudioContext)()),
      o = c.createOscillator(),
      g = c.createGain();
    if (c.state === "suspended") c.resume();
    o.connect(g);
    g.connect(c.destination);
    o.frequency.value = ok ? 1200 : 300;
    g.gain.value = 0.2;
    o.start();
    o.stop(c.currentTime + (ok ? 0.1 : 0.25));
  } catch {}
}

const scanBuzz = (p) => {
  try {
    navigator.vibrate && navigator.vibrate(p);
  } catch {}
};

function scanMsg(t, bad) {
  const m = $("#scanmsg");
  if (m) {
    m.textContent = t;
    m.className = bad ? "bad" : "";
  }
}

function loadZX() {
  return window.ZXing
    ? Promise.resolve()
    : new Promise((ok, no) => {
        const el = document.createElement("script");
        el.src = "zxing.min.js";
        el.onload = ok;
        el.onerror = () =>
          no(new Error("The scanner library could not load. Connect to the internet once and try again."));
        document.head.appendChild(el);
      });
}

export function scanClose() {
  SC.on = false;
  clearTimeout(SC.timer);
  if (SC.stream) SC.stream.getTracks().forEach((t) => t.stop());
  SC.stream = null;
  SC.video = null;
  const b = $("#scan");
  if (b) b.remove();
}

export async function scanOpen() {
  if (SC.on) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
    return toast("This browser cannot use the camera");
  try {
    ui.ac = ui.ac || new (window.AudioContext || window.webkitAudioContext)();
  } catch {} // created inside the tap so the beep is allowed
  SC.on = true;
  SC.last = "";
  SC.lastAt = 0;
  SC.n = 0;
  const box = document.createElement("div");
  box.id = "scan";
  box.className = "scanwrap";
  box.innerHTML =
    '<div class="scanbox"><h3>Scan items<button class="cxbtn" style="padding:10px 20px;font-size:15px" data-a="scanClose">Done</button></h3><div class="scanview"><video playsinline muted></video><i></i></div><div id="scanmsg">Starting the camera…</div></div>';
  document.body.appendChild(box);
  SC.video = box.querySelector("video");
  try {
    SC.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch (e) {
    scanClose();
    return toast(
      e && e.name === "NotAllowedError"
        ? "Camera is blocked. Allow the camera for this site in the browser settings."
        : "Camera not available: " + String((e && (e.message || e.name)) || e).slice(0, 80),
    );
  }
  if (!SC.on) {
    SC.stream.getTracks().forEach((t) => t.stop());
    SC.stream = null;
    return;
  } // closed while the permission prompt was open
  SC.video.srcObject = SC.stream;
  try {
    await SC.video.play();
  } catch {}
  SC.det = null;
  if ("BarcodeDetector" in window) {
    try {
      const sup = await BarcodeDetector.getSupportedFormats(),
        f = SCAN_FORMATS.filter((x) => sup.includes(x));
      if (f.length) SC.det = new BarcodeDetector({ formats: f });
    } catch {}
  }
  if (!SC.det) {
    try {
      await loadZX();
    } catch (e) {
      scanClose();
      return toast(e.message);
    }
    const Z = window.ZXing,
      h = new Map();
    h.set(Z.DecodeHintType.POSSIBLE_FORMATS, [
      Z.BarcodeFormat.EAN_13,
      Z.BarcodeFormat.EAN_8,
      Z.BarcodeFormat.UPC_A,
      Z.BarcodeFormat.UPC_E,
      Z.BarcodeFormat.CODE_128,
      Z.BarcodeFormat.CODE_39,
      Z.BarcodeFormat.ITF,
    ]);
    h.set(Z.DecodeHintType.TRY_HARDER, true);
    SC.zx = new Z.MultiFormatReader();
    SC.zx.setHints(h);
    SC.canvas = document.createElement("canvas");
  }
  if (!SC.on) return;
  scanMsg("Point the camera at a barcode");
  scanLoop();
}

function zxFrame(v) {
  const w = v.videoWidth,
    hh = v.videoHeight;
  if (!w || !hh) return "";
  const Z = window.ZXing,
    c = SC.canvas,
    k = Math.min(1, 1024 / w);
  c.width = Math.round(w * k);
  c.height = Math.round(hh * k);
  c.getContext("2d", { willReadFrequently: true }).drawImage(v, 0, 0, c.width, c.height);
  try {
    return SC.zx
      .decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(c))))
      .getText();
  } catch {
    return "";
  }
}

async function scanLoop() {
  if (!SC.on) return;
  const v = SC.video;
  let code = "";
  try {
    if (v && v.readyState >= 2)
      code = SC.det ? ((await SC.det.detect(v))[0] || {}).rawValue || "" : zxFrame(v);
  } catch {}
  if (code && SC.on) await scanHit(code);
  if (SC.on) SC.timer = setTimeout(scanLoop, SC.det ? 80 : 120);
}

async function scanHit(code) {
  const now = Date.now();
  if (code === SC.last && now - SC.lastAt < 1500) {
    SC.lastAt = now;
    return;
  } // same code still in view: ignore. Take it away for 1.5 s to scan another of the same item
  SC.last = code;
  SC.lastAt = now;
  const p = prodByBarcode(code);
  if (!p) {
    scanBeep(false);
    scanBuzz([80, 60, 80]);
    scanMsg("No product with barcode " + code, true);
    return;
  }
  if ((p.variations || []).length) {
    scanBeep(true);
    scanBuzz(50);
    scanClose();
    await scanItem(code);
    return;
  } // sizes: close the camera and let the cashier pick
  const r = await scanItem(code);
  if (!r.ok) {
    scanBeep(false);
    scanBuzz([80, 60, 80]);
    scanMsg(
      r.storageIssue
        ? "Check the till message before scanning again."
        : p.name + " is out of stock. Not added.",
      true,
    );
    return;
  }
  scanBeep(true);
  scanBuzz(50);
  SC.n++;
  scanMsg("Added: " + p.name + " · " + money(p.price) + "   (" + SC.n + " scanned)");
}
