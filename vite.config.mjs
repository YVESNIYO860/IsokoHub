import { defineConfig } from 'vite';
import { cpSync, copyFileSync, mkdirSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
const cleanRoutePages = [
  'about',
  'admin-chat',
  'admin-profile',
  'admin',
  'blog-post',
  'chat-inbox',
  'chat',
  'checkout',
  'dashboard',
  'househub-sell',
  'houses-rent',
  'image-studio',
  'login',
  'privacy',
  'product',
  'products',
  'sell',
  'seller-profile',
  'shop',
  'shopping-assistant',
  'signup',
  'support',
  'terms',
  'visitors'
];
const legacyRoutePages = cleanRoutePages.map((page) => `${page}.html`);

async function minifyJavaScriptFiles(directory) {
  if (!(await stat(directory)).isDirectory()) {
    if (directory.endsWith('.js')) {
      const source = await readFile(directory, 'utf8');
      const { code } = await transformWithEsbuild(source, directory, {
        minify: true,
        target: 'es2020'
      });
      await writeFile(directory, code, 'utf8');
    }
    return;
  }

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await minifyJavaScriptFiles(filePath);
    } else if (entry.isFile() && filePath.endsWith('.js')) {
      const source = await readFile(filePath, 'utf8');
      const { code } = await transformWithEsbuild(source, filePath, {
        minify: true,
        target: 'es2020'
      });
      await writeFile(filePath, code, 'utf8');
    }
  }
}

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  build: {
    sourcemap: false
  },
  plugins: [{
    name: 'isokohub-local-api',
    configureServer(server) {
      const handlers = {
        '/api/shopping-assistant': require('./api/shopping-assistant.js'),
        '/api/product-intelligence': require('./api/product-intelligence.js')
      };
      server.middlewares.use((request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url, 'http://localhost').pathname;
        } catch {
          return next();
        }
        const handler = handlers[pathname];
        if (!handler) return next();
        Promise.resolve(handler(request, response)).catch((error) => {
          console.error('[local-api] request failed:', error);
          if (!response.headersSent) {
            response.statusCode = 500;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.end(JSON.stringify({ error: 'The request could not be completed.' }));
          }
        });
      });
    }
  }, {
    name: 'copy-runtime-assets',
    apply: 'build',
    async closeBundle() {
      const outputDirectory = resolve(projectRoot, 'dist');
      const runtimeOutput = resolve(outputDirectory, 'js');
      cpSync(resolve(projectRoot, 'js'), runtimeOutput, { recursive: true });
      await minifyJavaScriptFiles(runtimeOutput);
      cpSync(resolve(projectRoot, 'assets'), resolve(outputDirectory, 'assets'), { recursive: true });
      copyFileSync(resolve(projectRoot, 'manifest.json'), resolve(outputDirectory, 'manifest.json'));
      const serviceWorkerOutput = resolve(outputDirectory, 'sw.js');
      copyFileSync(resolve(projectRoot, 'sw.js'), serviceWorkerOutput);
      await minifyJavaScriptFiles(resolve(outputDirectory, 'sw.js'));
      mkdirSync(resolve(outputDirectory, 'home'), { recursive: true });
      copyFileSync(resolve(outputDirectory, 'index.html'), resolve(outputDirectory, 'home', 'index.html'));
      for (const page of cleanRoutePages) {
        const pageDirectory = resolve(outputDirectory, page);
        mkdirSync(pageDirectory, { recursive: true });
        copyFileSync(resolve(outputDirectory, 'index.html'), resolve(pageDirectory, 'index.html'));
      }
      for (const page of legacyRoutePages) {
        copyFileSync(resolve(outputDirectory, 'index.html'), resolve(outputDirectory, page));
      }
    }
  }]
});
