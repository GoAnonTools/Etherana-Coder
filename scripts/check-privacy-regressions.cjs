#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();

const forbiddenChecks = [
  {
    name: 'extension aiKey fields',
    roots: ['extensions'],
    include: file => file.endsWith('package.json') && file.includes(`${path.sep}extensions${path.sep}`),
    patterns: [/"aiKey"\s*:/],
  },
  {
    name: 'Microsoft Application Insights key',
    roots: ['extensions', 'src', 'product.json'],
    include: () => true,
    patterns: [/0c6ae279ed8443289764825290e4f9e2-1a736e7c-1324-4338-be46-fc2a58ae4d14-7255/],
  },
  {
    name: 'runtime extension telemetry constructors',
    roots: [
      'extensions/typescript-language-features/src',
      'extensions/github-authentication/src',
      'extensions/microsoft-authentication/src',
      'extensions/html-language-features/client/src',
      'extensions/json-language-features/client/src',
    ],
    include: () => true,
    patterns: [
      /new\s+TelemetryReporter\s*\(/,
      /new\s+VsCodeTelemetryReporter\s*\(/,
      /context\.extension\.packageJSON\.aiKey/,
    ],
  },
  {
    name: 'built-in extension telemetry re-enable triggers',
    roots: [
      'extensions/github/src',
      'extensions/git/src',
      'extensions/merge-conflict/src',
      'extensions/markdown-language-features/src',
      'extensions/html-language-features/client/src',
      'extensions/json-language-features/client/src',
    ],
    include: file => file.endsWith('.ts'),
    patterns: [
      /from\s+['"]@vscode\/extension-telemetry['"]/,
      /require\(['"]@vscode\/extension-telemetry['"]\)/,
      /new\s+TelemetryReporter\s*\([^)]*aiKey/,
      /new\s+VSCodeTelemetryReporter\s*\(/,
      /packageJSON\.aiKey/,
      /extension\.packageJSON\.aiKey/,
      /context\.extension\.packageJSON[^\n]*aiKey/,
    ],
  },
  {
    name: 'TAS experimentation runtime calls',
    roots: [
      'extensions/typescript-language-features/src',
      'extensions/github-authentication/src',
      'extensions/microsoft-authentication/src',
      'extensions/html-language-features/client/src',
      'extensions/json-language-features/client/src',
    ],
    include: () => true,
    patterns: [
      /getExperimentationService\s*\(/,
      /initialFetch/,
      /from\s+['"]vscode-tas-client['"]/,
    ],
  },
  {
    name: 'core 1DS telemetry re-enable triggers',
    roots: [
      'product.json',
      'src/vs/server/node/serverServices.ts',
      'src/vs/code/node/cliProcessMain.ts',
      'src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts',
      'src/vs/code/electron-main/app.ts',
    ],
    include: () => true,
    patterns: [
      /"aiConfig"\s*:/,
      /new\s+OneDataSystemAppender\s*\(/,
      /productService\.aiConfig/,
      /ariaKey/,
    ],
  },
  {
    name: 'Microsoft-routed OAuth identifiers',
    roots: [
      'extensions/github-authentication/src',
      'extensions/microsoft-authentication/src',
      'extensions/github-authentication/package.json',
      'extensions/microsoft-authentication/package.json',
      'product.json',
    ],
    include: () => true,
    patterns: [
      /01ab8ac9400c4e429b23/,
      /vscode\.dev\/redirect/,
      /insiders\.vscode\.dev\/redirect/,
      /aebc6443-996d-45c2-90f0-388ff96faa56/,
      /VSCODE_CLIENT_ID/,
    ],
  },
];

const ignoredDirs = new Set([
  'node_modules',
  'out',
  'dist',
  '.git',
]);

function walk(target, files = []) {
  const full = path.resolve(root, target);
  if (!fs.existsSync(full)) {
    return files;
  }

  const stat = fs.statSync(full);
  if (stat.isFile()) {
    files.push(full);
    return files;
  }

  for (const entry of fs.readdirSync(full)) {
    if (ignoredDirs.has(entry)) {
      continue;
    }

    const next = path.join(full, entry);
    const nextStat = fs.statSync(next);

    if (nextStat.isDirectory()) {
      walk(path.relative(root, next), files);
    } else if (nextStat.isFile()) {
      files.push(next);
    }
  }

  return files;
}

let failures = 0;

for (const check of forbiddenChecks) {
  const matches = [];

  for (const checkRoot of check.roots) {
    for (const file of walk(checkRoot)) {
      if (!check.include(file)) {
        continue;
      }

      const text = fs.readFileSync(file, 'utf8');
      const rel = path.relative(root, file);

      for (const pattern of check.patterns) {
        if (pattern.test(text)) {
          matches.push(`${rel} matched ${pattern}`);
        }
      }
    }
  }

  if (matches.length) {
    failures += matches.length;
    console.error(`\n[privacy-regression] ${check.name}`);
    for (const match of matches) {
      console.error(`  - ${match}`);
    }
  }
}

if (failures > 0) {
  console.error(`\nPrivacy regression check failed with ${failures} match(es).`);
  process.exit(1);
}

console.log('Privacy regression check passed.');
