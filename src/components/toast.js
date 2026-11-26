export function toast(t) {
  // several messages stack upwards instead of hiding each other; problems stay up longer
  const bad = /could not|no permission|out of date|failed|not enough|went wrong/i.test(t),
    n = document.querySelectorAll(".toast").length,
    d = document.createElement("div");
  d.className = "toast";
  d.textContent = t;
  d.style.bottom = 84 + n * 48 + "px";
  document.body.appendChild(d);
  setTimeout(() => d.remove(), bad ? 9000 : 2800);
}
