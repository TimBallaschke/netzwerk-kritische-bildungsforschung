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

test('category filtering happens before capping so later entries remain reachable', () => {
  const categories = [...Array(25).fill('event'), ...Array(25).fill('post')];
  assert.deepEqual(select(categories, ['post'], true), Array.from({ length: 12 }, (_, i) => i + 25));
  assert.deepEqual(select(categories, ['post'], false), Array.from({ length: 15 }, (_, i) => i + 25));
  assert.deepEqual(select(categories, ['missing'], true), []);
  assert.deepEqual(select([], [], false), []);
});

test('expanding back to desktop restores the later cards without changing their order', () => {
  const categories = Array(30).fill('post');
  const desktop = select(categories, [], false);
  const mobile = select(categories, [], true);
  assert.deepEqual(mobile, desktop.slice(0, 12));
  assert.deepEqual(select(categories, [], false), desktop);
});
