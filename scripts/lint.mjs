import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git', 'node_modules', 'coverage']);
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.json', '.md', '.yml', '.yaml']);

const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relPath = fullPath.replace(`${ROOT}/`, '');

    if (SKIP_DIRS.has(entry)) {
      continue;
    }

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const ext = extname(entry);
    if (TEXT_EXTENSIONS.has(ext)) {
      files.push({ fullPath, relPath, ext });
    }
  }
}

walk(ROOT);

const errors = [];

for (const file of files) {
  const content = readFileSync(file.fullPath, 'utf8');

  if (content.includes('\r\n')) {
    errors.push(`${file.relPath}: har CRLF line endings (skal være LF).`);
  }

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (/\s+$/.test(line) && line.length > 0) {
      if (!(file.ext === '.md')) {
        errors.push(`${file.relPath}:${index + 1} har trailing whitespace.`);
      }
    }

    if (line.includes('\t')) {
      errors.push(`${file.relPath}:${index + 1} indeholder TAB (brug spaces).`);
    }
  });

  if (file.ext === '.js' || file.ext === '.mjs') {
    const check = spawnSync('node', ['--check', file.fullPath], {
      encoding: 'utf8'
    });

    if (check.status !== 0) {
      errors.push(`${file.relPath}: JavaScript syntaksfejl.\n${check.stderr}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Lint fejlede med følgende fejl:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`✅ Lint OK (${files.length} filer kontrolleret).`);
