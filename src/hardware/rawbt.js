export function rawbtSend(bytes) {
  let bin = "";
  bytes.forEach((x) => {
    bin += String.fromCharCode(x);
  });
  location.href = "intent:base64," + btoa(bin) + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
}
