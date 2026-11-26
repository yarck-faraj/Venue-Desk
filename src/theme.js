const THEME_KEY = "venuedesk-theme";

function setTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelectorAll(".theme-input").forEach((input) => {
    input.checked = dark;
  });
}

const saved = localStorage.getItem(THEME_KEY);
setTheme(saved === "dark" ? "dark" : "light");

document.addEventListener("change", (event) => {
  const input = /** @type {HTMLInputElement} */ (event.target);
  if (!input.matches(".theme-input")) return;
  const theme = input.checked ? "dark" : "light";
  localStorage.setItem(THEME_KEY, theme);
  setTheme(theme);
});
