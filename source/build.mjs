// Сборка: node build.mjs → dist/index.html (один файл, работает офлайн, открывается двойным кликом)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const res = await build({
  entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, write: false,
  target: 'es2020', legalComments: 'none',
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync('src/template.html', 'utf8').replace('/*__BUNDLE__*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html);
console.log('dist/index.html', (html.length / 1024).toFixed(0) + ' KB');
