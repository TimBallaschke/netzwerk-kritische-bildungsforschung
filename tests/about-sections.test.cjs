const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const result = JSON.parse(execFileSync('php', [path.join(__dirname, 'about-sections.php')], { encoding: 'utf8' }));

test('Panel serializes multiple optional contacts per section without validation errors', () => {
  assert.deepEqual(result.formErrors, []);
  assert.equal(result.contactFieldType, 'structure');
  assert.equal(result.emailFieldType, 'email');
  assert.equal(result.contactLimit, null);
  assert.deepEqual(result.contactCounts, [0, 4, 0]);
});

test('populated additional sections render with all contacts and existing formatting', () => {
  assert.equal(result.sectionCount, 3);
  assert.deepEqual(result.renderedNames, ['● Anna Beispiel', '● Robin Muster', '● Dr. A & B', '● Person ohne öffentliche E-Mail']);
  assert.equal(result.mailLinks.length, 3);
  assert.equal(result.emptyContactLists, 0);
  assert.ok(result.mainContacts > 0);
  assert.ok(result.italicText > 0);
  assert.equal(result.genderStarsPreserved, true);
});

test('section links and contact emails preserve their actual targets', () => {
  assert.deepEqual(result.mailLinks, ['mailto:anna@example.org', 'mailto:robin@example.org', 'mailto:sehr.lange.kontaktadresse@bildungsforschung.example.org']);
  assert.deepEqual(result.sectionLinks, ['mailto:mitmachen@example.org', 'https://example.org/arbeitskreis?thema=bildung&sprache=de']);
  assert.match(result.legacyEmailHtml, /href="mailto:legacy@example.org"/);
  assert.doesNotMatch(result.legacyEmailHtml, /target="_blank"/);
});
