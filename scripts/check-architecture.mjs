// Enforces the modular architecture of src/app (see README, "Frontend architecture").
import fs from 'node:fs';
import path from 'node:path';

const APP = path.resolve('src/app');

// Which modules each module may use (only through their public API: '@modules/<name>').
const ALLOWED = {
  users: [],
  templates: ['users'],
  minutes: [],
  requests: ['users', 'minutes'],
  session: ['requests'],
  repository: ['users', 'requests'],
};

// Layers outside modules/ and the layers they may import.
const LAYERS = {
  core: ['core'],
  shared: ['core', 'shared'],
  layout: ['core', 'shared', 'layout'],
};

const ALIASES = {
  '@core/': 'core/',
  '@shared/': 'shared/',
  '@layout/': 'layout/',
  '@modules/': 'modules/',
};

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) return walk(full);
    return d.name.endsWith('.ts') && !d.name.endsWith('.spec.ts') ? [full] : [];
  });

const toRel = (abs) => path.relative(APP, abs).split(path.sep).join('/');

const resolve = (fileRel, spec) => {
  for (const [alias, dir] of Object.entries(ALIASES)) {
    if (spec.startsWith(alias)) return dir + spec.slice(alias.length);
  }
  if (spec.startsWith('.')) return toRel(path.resolve(APP, path.dirname(fileRel), spec));
  return null; // npm package
};

const layerOf = (rel) => {
  if (rel.startsWith('..')) return { kind: 'outside' };
  const [top, name] = rel.split('/');
  if (top === 'modules') return { kind: 'module', name };
  if (top in LAYERS) return { kind: 'layer', name: top };
  if (top === 'i18n') return { kind: 'outside' };
  return { kind: 'root' };
};

const errors = [];
const fail = (file, spec, reason) => errors.push(`${file}: '${spec}' -> ${reason}`);

const modules = fs.readdirSync(path.join(APP, 'modules'));
for (const m of modules) {
  if (!(m in ALLOWED)) errors.push(`modules/${m}: module not declared in ALLOWED`);
  if (!fs.existsSync(path.join(APP, 'modules', m, 'index.ts'))) {
    errors.push(`modules/${m}: missing public API (index.ts)`);
  }
}

const visiting = new Set();
const done = new Set();
const visit = (m, trail) => {
  if (done.has(m)) return;
  if (visiting.has(m)) return errors.push(`ALLOWED has a cycle: ${[...trail, m].join(' -> ')}`);
  visiting.add(m);
  (ALLOWED[m] ?? []).forEach((d) => visit(d, [...trail, m]));
  visiting.delete(m);
  done.add(m);
};
Object.keys(ALLOWED).forEach((m) => visit(m, []));

const importRe =
  /(?:^|\n)\s*(?:import|export)\s[^'";]*?from\s+'([^']+)'|import\(\s*'([^']+)'\s*\)/g;

for (const abs of walk(APP)) {
  const file = toRel(abs);
  const src = fs.readFileSync(abs, 'utf8');
  const from = layerOf(file);
  for (const match of src.matchAll(importRe)) {
    const spec = match[1] ?? match[2];
    const target = resolve(file, spec);
    if (target === null) continue;
    const to = layerOf(target);
    if (to.kind === 'outside') continue;

    if (from.kind === 'layer') {
      if (to.kind !== 'layer' || !LAYERS[from.name].includes(to.name)) {
        fail(file, spec, `${from.name} may only import ${LAYERS[from.name].join(', ')}`);
      }
      continue;
    }

    if (from.kind === 'module') {
      if (to.kind === 'root' || (to.kind === 'layer' && to.name === 'layout')) {
        fail(file, spec, 'modules may not import the app shell or root files');
      } else if (to.kind === 'module' && to.name !== from.name) {
        if (spec !== `@modules/${to.name}`) {
          fail(
            file,
            spec,
            `import other modules only through their public API '@modules/${to.name}'`,
          );
        } else if (!ALLOWED[from.name]?.includes(to.name)) {
          fail(file, spec, `module '${from.name}' may not depend on '${to.name}'`);
        }
      } else if (to.kind === 'module' && spec.startsWith('@modules/')) {
        fail(file, spec, 'use relative imports inside the same module');
      }
      continue;
    }

    if (from.kind === 'root' && to.kind === 'module') {
      const publicApi = spec === `@modules/${to.name}`;
      const routes = spec === `@modules/${to.name}/${to.name}.routes`;
      if (!publicApi && !routes)
        fail(file, spec, 'root files may only import module index or routes');
    }
  }
}

if (errors.length) {
  console.error(`Architecture check failed (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('Architecture check passed');
