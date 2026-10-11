import { defineConfig } from 'vite';
import { cpSync, copyFileSync, mkdirSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
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
    name: 'copy-runtime-assets',
    apply: 'build',
    async closeBundle() {
      const outputDirectory = resolve(projectRoot, 'dist');
      const runtimeOutput = resolve(outputDirectory, 'js');
      cpSync(resolve(projectRoot, 'js'), runtimeOutput, { recursive: true });
      await minifyJavaScriptFiles(runtimeOutput);
      cpSync(resolve(projectRoot, 'assets'), resolve(outputDirectory, 'assets'), { recursive: true });
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
