import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { maestroEnv } from './maestro-env';

/**
 * Fails if a Maestro flow uses a literal element id or an unknown variable.
 * Element ids must be `${VARIABLE}`s generated from @buggybooks/contracts.
 */
const maestroDir = path.join(path.dirname(__dirname), 'maestro');
const known = new Set(Object.keys(maestroEnv('http://localhost:4000')));
const problems: string[] = [];

const flowFiles = ['flows', 'subflows'].flatMap((dir) =>
  readdirSync(path.join(maestroDir, dir))
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => path.join(dir, f)),
);

for (const file of flowFiles) {
  readFileSync(path.join(maestroDir, file), 'utf8')
    .split('\n')
    .forEach((line, index) => {
      const where = `${file}:${index + 1}`;
      const idMatch = line.match(/^\s*(?:-\s*)?id:\s*(.+?)\s*$/);
      if (idMatch && !/^\$\{[A-Z0-9_]+\}$/.test(idMatch[1] ?? '')) {
        problems.push(`${where} literal id ${idMatch[1]}; use a variable from @buggybooks/contracts`);
      }
      for (const [, name] of line.matchAll(/\$\{([A-Za-z0-9_]+)\}/g)) {
        if (name && !known.has(name)) problems.push(`${where} unknown variable \${${name}}`);
      }
    });
}

if (problems.length > 0) {
  process.stderr.write(`Maestro flow check failed:\n  ${problems.join('\n  ')}\n`);
  process.exit(1);
}
process.stdout.write(`Maestro flow check passed (${known.size} contract variables).\n`);
