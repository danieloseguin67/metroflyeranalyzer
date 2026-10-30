const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const nativeFetch = global.fetch;

// Exercise the actual component methods without needing an Angular browser runner.
const source = fs.readFileSync('src/app/app.component.ts', 'utf8');
const ast = ts.createSourceFile('app.ts', source, ts.ScriptTarget.Latest, true);
const component = ast.statements.find(s => ts.isClassDeclaration(s) && s.name.text === 'AppComponent');
const names = ['tr', 'displayPrice', 'displayPriceUnit', 'formatPrice', 'moiPrice', 'hasSeparateMoiPrice', 'discount', 'frenchUnit', 'refreshFlyer', 'formatFlyerPeriod', 'importJson'];
const methods = component.members.filter(m => m.name && names.includes(m.name.getText(ast))).map(m => m.getText(ast)).join('\n');
const moduleObject = { exports: {} };
new Function('module', ts.transpile(`class Harness { ${methods} }; module.exports = Harness;`))(moduleObject);
function signal(value) { return Object.assign(() => value, { set: next => value = next }); }
function setup() {
  const app = new moduleObject.exports();
  app.language = signal('en'); app.measureSystem = signal('metric');
  for (const name of ['refreshing', 'refreshError', 'items', 'loadedFlyerPeriod', 'search', 'selectedCategory', 'selected', 'page']) app[name] = signal(null);
  app.notify = () => {};
  app.selectedFlyerRange = () => ({ id: '2026-10-22', start: new Date(2026, 9, 22), end: new Date(2026, 9, 28) });
  return app;
}
test('regular, flyer and Moi conversions share the same unit and discount', () => {
  const app = setup();
  const item = { price: 8, regularPrice: 10, moiPrice: 6 };
  assert.equal(app.discount(item), 40);
  assert.equal(app.discount({ price: 8, moiPrice: 6, regularPrice: null }), 25);
  assert.equal(app.moiPrice({ price: 8 }), 8);
  assert.equal(app.moiPrice({ price: 8, moiPrice: 0 }), 0);
  assert.equal(app.discount({ price: 12, regularPrice: 10 }), null);
  assert.equal(app.displayPrice(1, '100 g'), 10);
  assert.ok(Math.abs(app.displayPrice(1, 'lb') - 2.20462262) < 1e-8);
  assert.equal(app.displayPriceUnit('lb'), 'kg');
  app.measureSystem.set('imperial');
  assert.equal(app.displayPrice(1, '100 g'), 4.5359237);
  assert.equal(app.displayPriceUnit('100 g'), 'lb');
  assert.equal(app.displayPrice(null, 'lb'), null);
  assert.equal(app.formatPrice(null), '\u2014');
  assert.equal(app.formatPrice(NaN), '\u2014');
  assert.match(app.formatPrice(6), /6\.00/);
  app.language.set('fr'); assert.match(app.formatPrice(6), /6,00/);
});
test('import preserves all three prices including a zero Moi price', () => {
  global.FileReader = class { readAsText(file) { this.result = JSON.stringify(file); this.onload(); } };
  const app = setup();
  app.importJson({ target: { files: [{ items: [{ item: 'Test', category: 'Meat', price: 8, regularPrice: 10, moiPrice: 0 }] }] } });
  assert.equal(app.items()[0].regularPrice, 10);
  assert.equal(app.items()[0].moiPrice, 0);
  assert.equal(app.items()[0].price, 8);
});
test('Pages refresh requests fresh JSON under the repository base and replaces every price', async () => {
  const app = setup();
  global.document = { baseURI: 'https://example.github.io/metroflyeranalysis/' };
  const snapshot = JSON.parse(fs.readFileSync('public/flyers/2026-10-22.json'));
  global.fetch = async (url, options) => {
    assert.equal(url.href, 'https://example.github.io/metroflyeranalysis/flyers/2026-10-22.json');
    assert.equal(options.cache, 'no-store');
    return { ok: true, json: async () => snapshot };
  };
  app.items.set([{ price: 999, regularPrice: 999, moiPrice: 999 }]);
  await app.refreshFlyer();
  assert.deepEqual(app.items(), snapshot.items);
  assert.equal(app.items().find(item => item.moiPrice === 6).price, 8);
  assert.equal(app.refreshing(), false);
  assert.equal(app.refreshError(), '');
  assert.equal(app.page(), 1);
});
test('missing, invalid, or unreachable published data preserves grid prices', async () => {
  const app = setup();
  const old = [{ price: 8, moiPrice: 6, regularPrice: 10 }];
  for (const response of [async () => ({ok:false,status:404}), async () => { throw Error('offline'); }, async () => ({ok:true,json:async()=>({id:'wrong',items:[]})})]) {
    global.fetch = response; app.items.set(old);
    await app.refreshFlyer();
    assert.equal(app.items(), old);
    assert.match(app.refreshError(), /not refreshed/);
    assert.equal(app.refreshing(), false);
  }
});
test('production artifact includes dated price files and repository base', () => {
  const root = 'dist/metro-flyer-grid/browser';
  assert.match(fs.readFileSync(`${root}/index.html`, 'utf8'), /<base href="\/[^" ]+\/">/);
  const published = JSON.parse(fs.readFileSync(`${root}/flyers/2026-10-22.json`));
  assert.equal(published.id, '2026-10-22');
  assert.ok(published.items.some(item => item.moiPrice != null));
});
test('published JSON is reachable over HTTP at a GitHub Pages repository path', async () => {
  const http = require('node:http');
  const root = 'dist/metro-flyer-grid/browser';
  const server = http.createServer((request, response) => {
    const path = request.url.replace(/^\/metroflyeranalysis\//, '');
    if (path !== 'flyers/2026-10-22.json') { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', 'application/json');
    response.end(fs.readFileSync(`${root}/${path}`));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const app = setup();
    global.document = { baseURI: `http://127.0.0.1:${server.address().port}/metroflyeranalysis/` };
    global.fetch = nativeFetch;
    await app.refreshFlyer();
    assert.equal(app.refreshError(), '');
    assert.ok(app.items().some(item => item.moiPrice === 6));
    app.selectedFlyerRange = () => ({id:'2026-10-29',start:new Date(2026,9,29),end:new Date(2026,10,4)});
    const previous = app.items();
    await app.refreshFlyer();
    assert.equal(app.items(), previous);
    assert.match(app.refreshError(), /not refreshed/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
