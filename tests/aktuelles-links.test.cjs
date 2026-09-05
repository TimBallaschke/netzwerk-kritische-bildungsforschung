const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const cards = JSON.parse(execFileSync('php', [path.join(__dirname, 'aktuelles-links.php')], { encoding: 'utf8' }));

test('internal, legacy and Beitrag cards retain the overlay action', () => {
  for (const card of cards.filter(card => ['internal', 'legacy', 'post', 'legacy-post'].includes(card.mode))) {
    assert.equal(card.arrowTag, 'button', `${card.template} ${card.mode}`);
    assert.equal(card.popup, 'dialog');
  }
});

test('external card arrows link directly to the exact Panel URL in a new tab', () => {
  for (const card of cards.filter(card => card.mode === 'external')) {
    assert.equal(card.arrowTag, 'a', card.template);
    assert.equal(card.href, 'https://example.org/resource?a=1&b=2');
    assert.equal(card.target, '_blank');
    assert.equal(card.rel, 'noopener noreferrer');
    assert.equal(card.popup, '');
  }
});

test('no-link and incomplete external cards omit the arrow but keep the preview toggle', () => {
  for (const card of cards.filter(card => ['none', 'missing-url', 'invalid-url'].includes(card.mode))) {
    assert.equal(card.arrowTag, null, `${card.template} ${card.mode}`);
  }
  for (const card of cards) assert.equal(card.cardToggleCount, 1, `${card.template} ${card.mode}`);
});
