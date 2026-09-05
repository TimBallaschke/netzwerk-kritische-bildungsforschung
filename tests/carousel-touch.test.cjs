const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const carousel = { document: { querySelector: () => null } };
vm.runInNewContext(readFileSync('assets/script/aktuelles.js', 'utf8'), carousel);
const createMotion = () => carousel.createCarouselTouchMotion();

function flick(direction = 1) {
  const motion = createMotion();
  motion.begin(200, 600, 0, 0.4);
  for (let time = 20; time <= 160; time += 20) {
    motion.move(200, 600 - direction * time * 2, time);
  }
  motion.end(170);
  return motion;
}

test('swipes track the finger and keep their initial axis through diagonal jitter', () => {
  const motion = createMotion();
  motion.begin(200, 500, 0, 0.4);
  assert.equal(motion.move(198, 497, 16), 0, 'small tap movement is ignored');
  assert.equal(motion.dragging, false);
  assert.equal(motion.move(198, 450, 32), 20, 'the first drag includes the full finger distance');
  assert.equal(motion.move(250, 430, 48), 8, 'sideways jitter cannot reverse a vertical swipe');
  assert.equal(motion.step(100), 0, 'no inertia is added while the finger is down');

  motion.begin(200, 500, 100, 0.4);
  assert.equal(motion.move(100, 480, 120), 40);
  assert.equal(motion.move(90, 400, 140), 4, 'horizontal swipes also keep their axis');
});

test('quick flicks coast several cards further and slow smoothly in either direction', () => {
  for (const direction of [1, -1]) {
    const motion = flick(direction);
    let distance = 0;
    let previousStep = Infinity;
    for (let time = 0; time < 3000; time += 1000 / 60) {
      const delta = motion.step(1000 / 60) * direction;
      assert.ok(delta >= 0 && delta <= previousStep + 1e-9, 'the coast never accelerates or reverses');
      distance += delta;
      previousStep = delta;
    }
    assert.ok(distance > 180 && distance < 360, `a fast flick advances half to one extra revolution: ${distance}`);
    assert.equal(motion.velocity, 0, 'the coast comes to rest');
  }
});

test('momentum covers the same distance on 30, 60 and 120 Hz screens', () => {
  const distances = [30, 60, 120].map(hz => {
    const motion = flick();
    let distance = 0;
    for (let frame = 0; frame < hz * 3; frame++) distance += motion.step(1000 / hz);
    return distance;
  });
  assert.ok(Math.max(...distances) - Math.min(...distances) < 0.001);
});

test('a new touch immediately catches the moving scene and can reverse it', () => {
  const motion = flick();
  assert.ok(motion.step(100) > 0);
  motion.begin(200, 300, 400, 0.4);
  assert.equal(motion.step(100), 0);
  assert.equal(motion.velocity, 0);
  assert.equal(motion.move(200, 360, 430), -24);
  motion.end(440);
  assert.ok(motion.step(16) < 0);
});

test('taps, holding still and cancelled gestures never launch stale momentum', () => {
  const motion = createMotion();
  motion.begin(200, 500, 0, 0.4);
  motion.move(201, 499, 20);
  motion.end(30);
  assert.equal(motion.step(100), 0);

  motion.begin(200, 500, 100, 0.4);
  motion.move(200, 300, 200);
  motion.end(400);
  assert.equal(motion.step(100), 0, 'holding before release stops the carousel');

  const cancelled = flick();
  cancelled.cancel();
  assert.equal(cancelled.step(100), 0, 'pinch, touchcancel and hidden views discard momentum');
  assert.equal(cancelled.move(200, 50, 400), 0, 'cancelled gestures ignore remaining moves');
});

test('the final drag direction controls release, even after a fast reversal', () => {
  const motion = createMotion();
  motion.begin(200, 500, 0, 0.4);
  motion.move(200, 400, 30);
  motion.move(200, 450, 50);
  motion.end(60);
  assert.ok(motion.step(16) < 0);
});
