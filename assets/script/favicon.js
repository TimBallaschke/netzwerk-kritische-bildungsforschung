// Rotate the original HAL Timezone letters: N → K → B.
const icons = Array.from(document.querySelectorAll('link[data-favicon-frames]'), (link) => ({
  link,
  frames: JSON.parse(link.dataset.faviconFrames),
}));

if (icons.length) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const intervalMs = 1000;
  let frame = 0;
  let timer = null;

  function showFrame() {
    for (const icon of icons) {
      icon.link.href = icon.frames[frame];
    }
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    if (reducedMotion.matches) {
      frame = 0;
      showFrame();
      return;
    }

    timer = window.setInterval(() => {
      frame = (frame + 1) % icons[0].frames.length;
      showFrame();
    }, intervalMs);
  }

  reducedMotion.addEventListener('change', start);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', start);
  start();
}
