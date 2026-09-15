/**
 * Chiriandreses Museum — local dev server.
 *
 * One command for hands-on editing: build once, serve /docs, watch the source
 * folders, rebuild on every save, and live-reload the browser. No dependencies.
 *   npm run dev   →   http://localhost:3000
 *
 * Local convenience only. Production / CI still run `npm run build`
 * (.github/workflows/build-docs.yml). This never writes anything beyond what
 * build.js itself writes into /docs.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const PORT = process.env.PORT || 3000;

/* Source folders whose changes trigger a rebuild. `scripts/` is included so
 * edits to build.js take effect too (the module is re-required fresh each
 * time); edits to dev.js itself still need a manual restart. */
const WATCH = ['templates', 'assets', 'data', 'reference', 'scripts']
  .map((d) => path.join(ROOT, d))
  .filter((d) => fs.existsSync(d));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
};

/* Injected before </body> on every HTML response: a reconnecting SSE client
 * that reloads the page whenever the server signals a finished rebuild. Never
 * written to /docs — it only exists in what this server sends. */
const LIVE_RELOAD = `
<script>
(function () {
  var source = new EventSource("/__livereload");
  source.onmessage = function () { location.reload(); };
  source.onerror = function () {
    source.close();
    setTimeout(function () { location.reload(); }, 1000);
  };
})();
</script>`;

const clients = new Set();

function rebuild(reason) {
  const started = Date.now();
  try {
    delete require.cache[require.resolve('./build')];
    require('./build').build();
    console.log(`  ✓ rebuilt in ${Date.now() - started}ms${reason ? `  (${reason})` : ''}`);
    for (const res of clients) res.write('data: reload\n\n');
  } catch (err) {
    console.error('  ✗ build failed:\n' + (err && err.stack ? err.stack : err));
  }
}

let pending = null;
function scheduleRebuild(reason) {
  clearTimeout(pending);
  pending = setTimeout(() => rebuild(reason), 120);
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/__livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    });
    res.write('retry: 1000\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const reqPath = url === '/' ? '/index.html' : url;
  const filePath = path.join(DOCS, reqPath);
  if (!filePath.startsWith(DOCS)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 — not found: ${reqPath}`);
      return;
    }
    const ext = path.extname(filePath);
    const body =
      ext === '.html'
        ? data.toString().replace('</body>', `${LIVE_RELOAD}\n</body>`)
        : data;
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate',
    });
    res.end(body);
  });
});

console.log('Chiriandreses Museum — dev server\n');
rebuild('startup');

for (const dir of WATCH) {
  fs.watch(dir, { recursive: true }, (_event, file) => {
    // Skip editor scratch files / dotfiles so a save doesn't double-fire.
    // Also skip build.js's own write of data/objects.resolved.json — a
    // debug artifact regenerated on every build — otherwise that write
    // re-triggers the watcher, which rebuilds, which writes it again,
    // forever (this is the infinite-rebuild loop).
    if (file && (/[~]$/.test(file) || /(^|\/)\.[^/]/.test(file) || /objects\.resolved\.json$/.test(file))) return;
    scheduleRebuild(file || path.basename(dir));
  });
}

server.listen(PORT, () => {
  console.log(`\n  http://localhost:${PORT}\n`);
  console.log('  watching   ' + WATCH.map((d) => path.relative(ROOT, d) + '/').join('   '));
  console.log('  save a source file and the browser reloads itself. Ctrl+C to stop.\n');
});
