#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const extensionsRoot = path.join(repoRoot, 'extensions');

function copyDirContents(from, to) {
  if (!fs.existsSync(from)) {
    return false;
  }

  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from)) {
    const source = path.join(from, entry);
    const target = path.join(to, entry);
    fs.cpSync(source, target, { recursive: true, force: true });
  }

  return true;
}

let fixed = 0;
let checked = 0;

for (const extensionName of fs.readdirSync(extensionsRoot)) {
  const extensionDir = path.join(extensionsRoot, extensionName);
  const packageJsonPath = path.join(extensionDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!pkg.main || !pkg.main.startsWith('./out/')) {
    continue;
  }

  checked++;

  const expectedMain = path.join(extensionDir, pkg.main);
  const expectedMainWithJs = expectedMain.endsWith('.js') ? expectedMain : `${expectedMain}.js`;

  if (fs.existsSync(expectedMain) || fs.existsSync(expectedMainWithJs)) {
    continue;
  }

  const nestedSourceRoot = path.join(extensionDir, 'out', 'extensions', extensionName, 'src');
  const expectedOutRoot = path.join(extensionDir, 'out');

  if (copyDirContents(nestedSourceRoot, expectedOutRoot)) {
    fixed++;
    console.log(`[sync-extension-dev-output] synced ${extensionName}`);
  }
}

console.log(`[sync-extension-dev-output] checked ${checked} extensions, synced ${fixed}`);
