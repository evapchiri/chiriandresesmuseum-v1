/**
 * Minimal static file server for local preview of /docs.
 * No dependencies — just Node's built-in http and fs.
 * Run with: npm run serve
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ROOT = path.join(__dirname, "..", "docs");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

if (!fs.existsSync(ROOT)) {
  console.error('No docs/ folder found — run "npm run build" first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";

  const filePath = path.join(ROOT, reqPath);

  // Prevent path traversal outside docs/
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`404 — not found: ${reqPath}`);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      // Local preview only: never cache, so a rebuild is always picked up
      // on refresh without fighting the browser's heuristic caching.
      "Cache-Control": "no-store, must-revalidate",
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Serving docs/ at http://localhost:${PORT}`);
});
