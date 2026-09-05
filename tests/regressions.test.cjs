const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const vm = require('node:vm');

let server;
let baseUrl;
let serverErrors = '';

before(async () => {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn('php', ['-d', 'output_buffering=0', '-S', `127.0.0.1:${port}`, 'kirby/router.php'], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  server.stderr.on('data', (data) => { serverErrors += data; });
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) throw new Error(serverErrors);
    try { await fetch(baseUrl); return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('PHP test server did not start');
});

after(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
});

for (const route of ['/', '/ueber-uns', '/seminarplaene', '/aktuelles/beitraege']) {
  test(`${route} boots without plugin output and renders one document shell`, async () => {
    const response = await fetch(baseUrl + route);
    assert.equal(response.status, 200);
    const html = await response.text();
    for (const tag of ['html', 'body', 'main']) {
      assert.equal((html.match(new RegExp(`<${tag}(?:\\s|>)`, 'g')) || []).length, 1, `one opening ${tag}`);
      assert.equal((html.match(new RegExp(`</${tag}>`, 'g')) || []).length, 1, `one closing ${tag}`);
    }
    assert.ok(html.indexOf('<footer') < html.indexOf('</body>'));
    assert.doesNotMatch(html, /Kirby CMS Debugger|Disallowed output/);
    for (const [, id] of html.matchAll(/aria-controls="([^"]+)"/g)) {
      assert.ok(html.includes(`id="${id}"`), `disclosure target ${id} exists`);
    }
    // PHP and JS syntax checks alone don't catch broken inline Alpine code.
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    for (const [, directive, value] of html.matchAll(/\s(@[\w:.+-]+|:[\w:-]+|x-(?:data|init|show|effect))="([^"]*)"/g)) {
      const code = value.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      const statement = directive.startsWith('@') || ['x-init', 'x-effect'].includes(directive);
      assert.doesNotThrow(() => new AsyncFunction(statement ? code : `return (${code})`), `${directive}: ${code}`);
    }
  });
}

test('Weitere Beiträge target shared overlays and keep working article URLs', async () => {
  const overviewUrl = baseUrl + '/aktuelles/beitraege';
  const overview = await (await fetch(overviewUrl)).text();
  assert.match(overview, /Aktueller Beitrag/);
  assert.match(overview, /class="featured-post-card" x-data="disclosure"/);
  assert.match(overview, /id="featured-post-content"/);
  assert.equal((overview.match(/<dialog /g) || []).length, 1, 'one shared overlay on the overview');
  assert.match(overview, /data-content-dialog/);

  const decode = (value) => value.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/&amp;/g, '&');
  const articleLinks = (html) => [...html.matchAll(/class="interactive-list-item post-list-link" href="([^"]+)"/g)].map((match) => decode(match[1]));
  const links = articleLinks(overview);
  assert.ok(links.length > 0, 'the current content has older posts');

  const checkOverlayTargets = (html) => {
    const triggers = [...html.matchAll(/<a class="interactive-list-item post-list-link"[^>]+>/g)];
    const panels = [...html.matchAll(/data-modal-id="([^"]+)"/g)].map((match) => decode(match[1]));
    assert.equal(panels.length, triggers.length, 'each listed article has overlay content');
    for (const [trigger] of triggers) {
      assert.match(trigger, /aria-haspopup="dialog"/);
      assert.match(trigger, /@click\.prevent="\$dispatch\('open-modal'/);
      const id = decode(trigger.match(/data-id="([^"]+)"/)[1]);
      assert.equal(panels.filter((panel) => panel === id).length, 1, 'trigger selects exactly one article panel');
    }
  };
  checkOverlayTargets(overview);

  for (const url of links) {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    const article = await response.text();
    assert.match(article, /page-beitraege--detail/);
    assert.match(article, /<h1 class="post-title">/);
    assert.match(article, /<div class="full-text"\s*>/);
    assert.match(article, /class="post-author"/);
    assert.doesNotMatch(article, /class="preview-text"/);
    checkOverlayTargets(article);
    const returnLink = article.match(/class="toggle-btn post-back-link" href="([^"]+)"/);
    assert.equal(decode(returnLink[1]), overviewUrl);
    assert.ok(!articleLinks(article).includes(url), 'the open article is excluded from Weitere Beiträge');
  }
});

test('filtered feed entries retain their categories and share the carousel overlay', async () => {
  const preview = await fetch(baseUrl + '/preview/aktuelles');
  assert.equal(preview.status, 200, 'the list also renders without a current page in the isolated preview');
  const html = await (await fetch(baseUrl)).text();
  assert.equal((html.match(/<dialog /g) || []).length, 1, 'the list reuses the carousel dialog');
  const rows = [...html.matchAll(/<article class="interactive-list-item"[^>]*data-type="([^"]+)"[^>]*>[\s\S]*?<\/article>/g)];
  assert.ok(rows.length > 0, 'the feed contains entries');
  const filterKeys = new Set([...html.matchAll(/activeFilter === '([^']+)'/g)].map((match) => match[1]));
  const panelIds = [...html.matchAll(/data-modal-id="([^"]+)"/g)].map((match) => match[1]);
  for (const [row, type] of rows) {
    assert.ok(filterKeys.has(type), 'each category has a matching filter');
    const id = row.match(/data-id="([^"]+)"/)[1];
    assert.equal(panelIds.filter((panel) => panel === id).length, 1, 'each row opens exactly one existing panel');
    const linkType = row.match(/data-link-type="([^"]+)"/)[1];
    if (linkType === 'self') {
      assert.match(row, /<button[^>]+type="button"[^>]+aria-haspopup="dialog"/, 'internal rows are keyboard-operable');
    } else {
      assert.doesNotMatch(row, /\$dispatch\('open-modal'/, 'external and teaser rows must not open a detail dialog');
      if (linkType === 'external' && row.includes('href=')) assert.match(row, /target="_blank" rel="noopener noreferrer"/);
      if (linkType === 'none') assert.doesNotMatch(row, /<button|<a /);
    }
    const titleId = row.match(/aria-labelledby="([^"]+)"/)[1];
    assert.ok(row.includes(`id="${titleId}"`), 'the row is labelled by its own title');
  }
});

test('scroll lock and list/graphic switching keep carousel interactivity in sync', () => {
  const listeners = new Map();
  const documentListeners = new Map();
  const classes = new Set();
  const signals = [];
  const documentElement = {
    style: { setProperty() {} },
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, active) { active ? classes.add(name) : classes.delete(name); },
    },
  };
  const context = {
    history: {},
    document: {
      documentElement,
      body: { style: {} },
      querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 100, top: 100 }) }),
      addEventListener: (name, callback) => documentListeners.set(name, callback),
    },
    window: {
      scrollY: 500,
      scrollTo() {},
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
      dispatchEvent: (event) => signals.push(event.detail.active),
    },
    getComputedStyle: () => ({ getPropertyValue: () => '100px' }),
    CustomEvent: function (type, init) { this.type = type; this.detail = init.detail; },
  };
  vm.runInNewContext(readFileSync('assets/script/script.js', 'utf8'), context);
  documentListeners.get('DOMContentLoaded')();
  classes.add('modal-is-open');
  listeners.get('scroll')();
  assert.equal(signals.length, 0, 'opening a dialog must not trigger a page lock');
  classes.delete('modal-is-open');
  listeners.get('scroll')();
  assert.equal(documentElement.style.overflow, 'hidden');
  listeners.get('aktuelles:view')({ detail: { list: true } });
  assert.equal(documentElement.style.overflow, '');
  assert.equal(listeners.has('scroll'), false);
  listeners.get('aktuelles:view')({ detail: { list: false } });
  assert.deepEqual(signals, [true, false, true]);
});

test('shared carousel script is safe on pages without a carousel', () => {
  vm.runInNewContext(readFileSync('assets/script/aktuelles.js', 'utf8'), {
    document: { querySelector: () => null },
  });
});

test('empty feed does not start carousel geometry or animation', () => {
  vm.runInNewContext(readFileSync('assets/script/aktuelles.js', 'utf8'), {
    document: { querySelector: () => ({ querySelectorAll: () => [] }) },
  });
});
