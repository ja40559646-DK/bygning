import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const blockedPatterns = [
  { name: 'GitHub token', regex: /github_pat_[A-Za-z0-9_]+/g },
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Private key header', regex: /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----/g }
];

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => !f.endsWith('.md'));

const findings = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of blockedPatterns) {
    if (pattern.regex.test(content)) {
      findings.push(`${file}: ${pattern.name}`);
    }
  }
}

if (findings.length > 0) {
  console.error('❌ Security check fejlede. Fundne mønstre:');
  findings.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log(`✅ Security check OK (${files.length} tracked filer scannet).`);
