import { defineConfig } from 'vite';
import { cpSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  plugins: [{
    name: 'copy-runtime-assets',
    apply: 'build',
    closeBundle() {
      const outputDirectory = resolve(projectRoot, 'dist');
      cpSync(resolve(projectRoot, 'js'), resolve(outputDirectory, 'js'), { recursive: true });
      cpSync(resolve(projectRoot, 'assets'), resolve(outputDirectory, 'assets'), { recursive: true });
      copyFileSync(resolve(projectRoot, 'sw.js'), resolve(outputDirectory, 'sw.js'));
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
