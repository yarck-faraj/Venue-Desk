/** @param {() => void} render */
export function createRenderQueue(render) {
  let requestId = 0;

  return function queueRender() {
    if (requestId) return;
    requestId = requestAnimationFrame(() => {
      requestId = 0;
      render();
    });
  };
}
