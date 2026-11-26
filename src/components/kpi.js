export function kpi(label, value, tone) {
  const attribute = tone === undefined ? "" : ` class="${tone}"`;
  return `<div class="kpi"><span>${label}</span><b${attribute}>${value}</b></div>`;
}
