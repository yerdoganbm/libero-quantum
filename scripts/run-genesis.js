#!/usr/bin/env node
/**
 * LIBERO GENESIS v2.0 – CLI runner
 * npm run genesis veya npx libero-genesis
 */
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const script = path.join(root, 'libero-universal.ts');

const child = spawn(
  process.execPath,
  ['-r', 'ts-node/register', script],
  { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' }
);

child.on('exit', (code) => process.exit(code != null ? code : 0));
