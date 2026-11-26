import { createRenderQueue } from "../state/render-queue.js";
import { renderShell } from "../views/shell.js";

let views;

export function registerViews(registry) {
  views = registry;
}

export function render() {
  return renderShell(views);
}

export const queueRender = createRenderQueue(render);
