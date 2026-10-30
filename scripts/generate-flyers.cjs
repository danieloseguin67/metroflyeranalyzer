const fs = require('node:fs');
const ts = require('typescript');

// Publish every dated snapshot independently of the application's cached JS.
fs.mkdirSync('public/flyers', { recursive: true });
for (const file of fs.readdirSync('src/app').filter(name => /^metro-dollard-flyer(?:-\d{4}-\d{2}-\d{2})?\.ts$/.test(name))) {
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(`src/app/${file}`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('exports', js)(module.exports);
  const snapshot = Object.values(module.exports)[0];
  const date = new Date(snapshot.startDate);
  const id = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  fs.writeFileSync(`public/flyers/${id}.json`, JSON.stringify({ ...snapshot, id }, null, 2) + '\n');
}
