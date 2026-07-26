// build-ds-dist.mjs — pre-build for the design-sync converter.
//
// Why this exists: this repo is a CRA app whose components keep JSX in plain
// `.js` files. The design-sync converter's esbuild pass parses JSX only in
// `.jsx`/`.tsx`, so we transpile `client/src` (JSX -> createElement via the
// automatic runtime) into `client/.ds-dist`, mirror the assets (css/json/img),
// and generate `ds-entry.js` exporting exactly the components pinned in
// `.design-sync/config.json`'s componentSrcMap. The converter then treats
// `.ds-dist` like a normal package dist (cfg.entry points at ds-entry.js).
//
// Also emits `.ds-dist/ds-styles.css` = Google-Fonts Inter @import + the app's
// global.css (design tokens), and re-exports the module-private AuthContext so
// the preview provider (.design-sync/preview-provider.jsx) can stub auth.
//
// Run from repo root: node .design-sync/build-ds-dist.mjs
// (esbuild resolves via the .design-sync/node_modules symlink -> .ds-sync/)
import { transform } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'client', 'src');
const OUT = join(ROOT, 'client', '.ds-dist');
const CFG = JSON.parse(readFileSync(join(ROOT, '.design-sync', 'config.json'), 'utf8'));

const SKIP_DIR = new Set(['__tests__', '__mocks__', 'node_modules']);
const COPY_EXT = /\.(css|json|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf)$/i;
const JS_EXT = /\.(js|jsx)$/;

rmSync(OUT, { recursive: true, force: true });

const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (!SKIP_DIR.has(n)) walk(p); continue; }
    if (/\.(test|spec)\.[jt]sx?$/.test(n) || n === 'setupTests.js') continue;
    files.push(p);
  }
})(SRC);

let transpiled = 0, copied = 0;
for (const p of files) {
  const rel = relative(SRC, p);
  const dest = join(OUT, rel).replace(/\.jsx$/, '.js');
  mkdirSync(dirname(dest), { recursive: true });
  if (JS_EXT.test(p)) {
    const src = readFileSync(p, 'utf8');
    let { code } = await transform(src, { loader: 'jsx', jsx: 'automatic', sourcefile: rel });
    // Expose the module-private context for the preview provider's auth stub.
    if (rel === join('contexts', 'AuthContext.js') && !/export\s*{[^}]*\bAuthContext\b/.test(code)) {
      code += '\nexport { AuthContext };\n';
    }
    writeFileSync(dest, code);
    transpiled++;
  } else if (COPY_EXT.test(p)) {
    copyFileSync(p, dest);
    copied++;
  }
}

// ds-entry.js — named exports for every pinned component, from componentSrcMap.
// Pins are client/-relative (e.g. "src/components/common/Logo.js").
const lines = [];
for (const [name, srcPath] of Object.entries(CFG.componentSrcMap ?? {})) {
  if (srcPath === null) continue;
  const orig = join(ROOT, 'client', srcPath);
  if (!existsSync(orig)) { console.error(`! ds-entry: pinned src missing for ${name}: ${srcPath}`); process.exitCode = 1; continue; }
  const relFromEntry = './' + srcPath.replace(/^src\//, '').replace(/\.jsx$/, '.js');
  const hasDefault = /export\s+default\b/.test(readFileSync(orig, 'utf8'));
  lines.push(hasDefault
    ? `export { default as ${name} } from ${JSON.stringify(relFromEntry)};`
    : `export { ${name} } from ${JSON.stringify(relFromEntry)};`);
}
writeFileSync(join(OUT, 'ds-entry.js'), lines.join('\n') + '\n');

// ds-styles.css — Inter (loaded by the app from Google Fonts) + design tokens.
const globalCss = readFileSync(join(SRC, 'styles', 'global.css'), 'utf8');
writeFileSync(join(OUT, 'ds-styles.css'),
  '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");\n\n' + globalCss);

// NOTE: no package.json in OUT — the converter walks up from the entry to the
// nearest package.json to find the package root; it must land on client/.
console.error(`ds-dist: ${transpiled} transpiled, ${copied} assets copied, ${lines.length} entry exports -> ${relative(ROOT, OUT)}`);
