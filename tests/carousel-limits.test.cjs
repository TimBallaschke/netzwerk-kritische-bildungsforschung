const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const carousel = { document: { querySelector: () => null } };
vm.runInNewContext(readFileSync('assets/script/aktuelles.js', 'utf8'), carousel);
const select = (categories, active, mobile) => Array.from(carousel.selectCarouselCardIndices(categories, new Set(active), mobile));

test('network caps preserve Panel order at 15 desktop and 12 mobile cards', () => {
  const categories = Array.from({ length: 45 }, (_, i) => i % 5);
  assert.deepEqual(select(categories, [], false), Array.from({ length: 15 }, (_, i) => i));
  assert.deepEqual(select(categories, [], true), Array.from({ length: 12 }, (_, i) => i));
  assert.deepEqual(select(categories.slice(0, 7), [], true), [0, 1, 2, 3, 4, 5, 6]);
});

test('filters only hide cards within the fixed cap and never refill the scene', () => {
  const categories = Array.from({ length: 45 }, (_, i) => i % 2 ? 'post' : 'event');
  assert.deepEqual(select(categories, ['post'], true), [1, 3, 5, 7, 9, 11]);
  assert.deepEqual(select(categories, ['post'], false), [1, 3, 5, 7, 9, 11, 13]);
  assert.deepEqual(select([...Array(15).fill('event'), 'post'], ['post'], false), []);
  assert.deepEqual(select(categories, ['missing'], true), []);
  assert.deepEqual(select([], [], false), []);
});

test('changing and clearing filters retains the same original orbit slots', () => {
  const categories = Array.from({ length: 30 }, (_, i) => i % 3);
  for (const mobile of [false, true]) {
    const orbit = select(categories, [], mobile);
    for (const active of [[0], [1], [2], [0, 2], [], [1]]) {
      assert.deepEqual(select(categories, active, mobile), orbit.filter(i => !active.length || active.includes(categories[i])));
    }
    assert.deepEqual(select(categories, [], mobile), orbit);
  }
});

test('expanding back to desktop restores the later cards without changing their order', () => {
  const categories = Array(30).fill('post');
  const desktop = select(categories, [], false);
  const mobile = select(categories, [], true);
  assert.deepEqual(mobile, desktop.slice(0, 12));
  assert.deepEqual(select(categories, [], false), desktop);
});
