const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

if (fs.existsSync(viteEntry)) {
  const vite = spawn(process.execPath, [viteEntry, '--port=3000'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  vite.on('exit', (code) => process.exit(code ?? 0));
} else {
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };

  const server = http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405).end('Method not allowed');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
      response.writeHead(400).end('Bad request');
      return;
    }

    const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filePath = path.resolve(projectRoot, relativePath);
    if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    if (pathname === '/' || pathname === '/home' || pathname === '/home/' || pathname.endsWith('.html')) {
      const fallbackHtml = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>IsokoHub setup required</title><body><main><h1>IsokoHub needs its React build tools</h1><p>Install the project dependencies, then restart the development server.</p><code>npm install</code></main></body></html>`;
      response.writeHead(503, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(fallbackHtml),
        'Cache-Control': 'no-store'
      });
      response.end(request.method === 'HEAD' ? undefined : fallbackHtml);
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        response.writeHead(404).end('Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Content-Length': stats.size,
        'Cache-Control': 'no-store'
      });
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      fs.createReadStream(filePath).pipe(response);
    });
  });

  server.listen(3000, '127.0.0.1', () => {
    console.log('Vite is not installed; run npm install to start the React app at http://localhost:3000');
  });
}