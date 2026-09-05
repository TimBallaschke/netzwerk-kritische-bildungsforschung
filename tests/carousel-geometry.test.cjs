const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const geometry = { document: { querySelector: () => null } };
vm.runInNewContext(readFileSync('assets/script/aktuelles.js', 'utf8'), geometry);
const { projectCarouselOrbit, fitCarouselHorizontalRadius, containCarouselCard, carouselSideGutter } = geometry;
const projection = {
  cosX: Math.cos(-Math.PI / 6), sinX: Math.sin(-Math.PI / 6),
  cosZ: 1, sinZ: 0, perspective: 1600, minScale: 0.28, maxScale: 0.75,
};
const viewports = [240, 280, 320, 375, 390, 600, 768, 900, 901, 1280, 1440, 1920, 2560, 3840];

test('complete revolutions use the available width and preserve both side gutters, including hover', () => {
  for (const width of viewports) {
    const viewportProjection = { ...projection, maxScale: width <= 900 ? 0.65 : 0.75 };
    for (const radiusZ of [20, 80, 200]) {
      const cardWidths = Array.from({ length: 12 }, () => width * (width <= 900 ? 0.72 : 0.3));
      const jitters = cardWidths.map((_, i) => (i / 11 * 2 - 1) * radiusZ * 1.5);
      const radius = fitCarouselHorizontalRadius(width, cardWidths, radiusZ, jitters, viewportProjection, 0.03);
      const gutter = carouselSideGutter(width);
      let minLeft = width, minRight = width;
      for (let i = 0; i < cardWidths.length; i++) {
        // Denser than the fitting samples, including angles between them.
        for (let angle = 0; angle < 360; angle += 0.5) {
          const point = projectCarouselOrbit(angle * Math.PI / 180, radius, radiusZ, jitters[i], viewportProjection);
          const scale = point.scale + 0.03;
          const left = width / 2 + point.x - cardWidths[i] * scale / 2;
          const right = width / 2 - point.x - cardWidths[i] * scale / 2;
          assert.ok(left >= gutter - 0.01 && right >= gutter - 0.01, `${width}px: orbit must fit before clamping`);
          minLeft = Math.min(minLeft, left);
          minRight = Math.min(minRight, right);
        }
      }
      assert.ok(minLeft <= gutter + 2 && minRight <= gutter + 2, `${width}px: orbit should reach both safe edges`);
    }
  }
});

test('focus, hover and resizing keep even oversized cards inside the actual viewport', () => {
  for (const width of viewports) {
    for (const cardWidth of [width * 0.3, width * 0.72, width * 0.8, width * 1.4, 1152]) {
      for (const x of [-1800, -200, 0, 200, 1800]) {
        for (const scale of [0.28, 0.75, 1, 1.03, 1.4]) {
          const fitted = containCarouselCard(x, scale, cardWidth, width);
          const left = width / 2 + fitted.x - cardWidth * fitted.scale / 2;
          const right = width / 2 - fitted.x - cardWidth * fitted.scale / 2;
          const gutter = carouselSideGutter(width);
          assert.ok(left >= gutter - 0.000001 && right >= gutter - 0.000001, `${width}px: focused/resized card must fit`);
          assert.ok(fitted.scale <= scale && fitted.scale > 0);
          if (cardWidth * scale <= width - 2 * gutter) assert.equal(fitted.scale, scale, 'preserve card size whenever it fits');
          if (x === 0) assert.equal(fitted.x, 0, 'focused card remains centered');
        }
      }
    }
  }
});
