const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

test('one-way intro lock keeps Grafik aligned and Liste scrollable across resize and view changes', () => {
  const listeners = new Map();
  const documentListeners = new Map();
  const observers = [];
  const scrollCalls = [];
  const classes = new Set();
  const properties = new Map();
  let headerBottom = 158;
  let introHeight = 210;
  const header = { getBoundingClientRect: () => ({ bottom: headerBottom }) };
  const intro = {};
  const stage = { getBoundingClientRect: () => ({
    top: headerBottom + (classes.has('is-list-view') && classes.has('is-list-pinned') ? 0 : introHeight) - window.scrollY,
  }) };
  const documentElement = {
    style: { setProperty: (key, value) => properties.set(key, value) },
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, active) => active ? classes.add(name) : classes.delete(name),
    },
  };
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.elements = []; observers.push(this); }
    observe(element) { this.elements.push(element); }
  }
  const window = {
    scrollY: 0,
    ResizeObserver,
    scrollTo(options) { scrollCalls.push(options); this.scrollY = options.top; },
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
    dispatchEvent() {},
  };
  const emit = (name, event) => [...listeners.get(name)].forEach(callback => callback(event));
  vm.runInNewContext(readFileSync('assets/script/script.js', 'utf8'), {
    history: {}, window, ResizeObserver,
    document: {
      documentElement,
      body: { style: {} },
      querySelector: (selector) => selector === '.aktuelles' ? stage : selector === '.intro-text' ? intro : header,
      addEventListener: (name, callback) => documentListeners.set(name, callback),
    },
    getComputedStyle: () => ({ getPropertyValue: (key) => properties.get(key) }),
    CustomEvent: function (type, init) { this.type = type; this.detail = init.detail; },
  });
  documentListeners.get('DOMContentLoaded')();
  scrollCalls.length = 0;
  emit('resize');
  assert.equal(scrollCalls.length, 0, 'resize must not skip the intro before the user scrolls');

  emit('aktuelles:view', { detail: { list: true } });
  assert.equal(classes.has('is-list-pinned'), false, 'switching views before the snap point keeps the intro');
  window.scrollY = 100;
  emit('scroll');
  assert.equal(classes.has('is-list-pinned'), false, 'partial scrolling through the intro must remain possible');
  classes.add('modal-is-open');
  window.scrollY = introHeight + 50;
  emit('scroll');
  assert.equal(classes.has('is-list-pinned'), false, 'dialog layout changes must not dismiss the intro');
  classes.delete('modal-is-open');
  emit('scroll');
  assert.ok(classes.has('is-list-pinned'), 'reaching the list start permanently removes the intro from its scroll range');
  assert.equal(window.scrollY, 0, 'the list start becomes the native scroll origin');
  assert.equal(stage.getBoundingClientRect().top, headerBottom);
  assert.notEqual(documentElement.style.overflow, 'hidden', 'the list must stay scrollable');
  const callsAfterListPin = scrollCalls.length;
  window.scrollY = 2000;
  emit('scroll');
  assert.equal(scrollCalls.length, callsAfterListPin, 'scrolling down the feed must not be pulled back to the start');
  window.scrollY = 0;
  emit('scroll');
  assert.equal(stage.getBoundingClientRect().top, headerBottom, 'returning to the native top cannot expose the intro');
  emit('aktuelles:view', { detail: { list: false } });

  window.scrollY = introHeight;
  emit('scroll');
  assert.ok(classes.has('is-locked'));
  headerBottom = 133;
  introHeight = 310;
  emit('resize');
  assert.equal(stage.getBoundingClientRect().top, headerBottom, 'mobile layout remains flush with the header');
  assert.equal(scrollCalls.at(-1).behavior, 'instant');

  const layoutObserver = observers.find(observer => observer.elements.includes(intro));
  assert.ok(layoutObserver, 'observe text reflow independently of window resize');
  introHeight = 335;
  layoutObserver.callback();
  assert.equal(window.scrollY, 335, 'late font/layout changes update the pin');

  emit('aktuelles:view', { detail: { list: true } });
  assert.equal(window.scrollY, 0, 'switching from a locked Grafik carries the intro lock into Liste');
  assert.equal(documentElement.style.overflow, '');
  introHeight = 180;
  const listScrollY = window.scrollY;
  emit('resize');
  layoutObserver.callback();
  assert.equal(window.scrollY, listScrollY, 'list view retains its normal scroll position');

  emit('aktuelles:view', { detail: { list: false } });
  assert.equal(window.scrollY, introHeight, 'returning to Grafik uses the current snap point');
  headerBottom = 190;
  introHeight = 260;
  emit('resize');
  assert.equal(stage.getBoundingClientRect().top, headerBottom, 'growing back to desktop also stays aligned');
});
