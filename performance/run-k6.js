#!/usr/bin/env node

/**
 * BuggyBooks k6 Cross-Platform Test Runner
 *
 * Automatically detects k6 in system PATH or performance/bin/, or downloads the standalone
 * binary without requiring admin permissions or package managers.
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const binDir = path.resolve(__dirname, 'bin');
const localBinary = path.join(binDir, isWindows ? 'k6.exe' : 'k6');

function isCommandAvailable(cmd) {
  try {
    const res = spawnSync(cmd, ['version'], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function extractZip(zipPath, targetDir) {
  if (isWindows) {
    const psCmd = `Expand-Archive -Path "${zipPath}" -DestinationPath "${targetDir}" -Force; Get-ChildItem -Path "${targetDir}" -Recurse -Filter "k6.exe" | Select-Object -First 1 | ForEach-Object { Copy-Item $_.FullName -Destination "${localBinary}" -Force }`;
    spawnSync('powershell', ['-NoProfile', '-Command', psCmd], { stdio: 'inherit' });
  } else {
    spawnSync('tar', ['-xzf', zipPath, '-C', targetDir], { stdio: 'inherit' });
  }
}

function resolveK6Executable() {
  if (isCommandAvailable('k6')) {
    return 'k6';
  }

  if (fs.existsSync(localBinary)) {
    return localBinary;
  }

  console.log('⚡ k6 not found in PATH. Provisioning portable k6 binary into performance/bin/...');
  ensureDirectoryExists(binDir);

  const version = 'v2.2.0';
  const zipPath = path.join(binDir, 'k6.zip');

  if (!fs.existsSync(zipPath)) {
    const downloadUrl = isWindows
      ? `https://github.com/grafana/k6/releases/download/${version}/k6-${version}-windows-amd64.zip`
      : `https://github.com/grafana/k6/releases/download/${version}/k6-${version}-linux-amd64.tar.gz`;

    console.log(`📥 Downloading k6 binary via curl: ${downloadUrl}`);
    const curlRes = spawnSync('curl.exe', ['-L', '-o', zipPath, downloadUrl], { stdio: 'inherit' });
    if (curlRes.status !== 0) {
      throw new Error(`Failed to download k6 archive via curl: status ${curlRes.status}`);
    }
  }

  console.log(`📦 Extracting k6 archive...`);
  extractZip(zipPath, binDir);

  if (fs.existsSync(localBinary)) {
    if (!isWindows) {
      fs.chmodSync(localBinary, '755');
    }
    console.log(`✅ k6 binary provisioned successfully at ${localBinary}`);
    return localBinary;
  }

  throw new Error('Could not locate extracted k6 executable in ' + binDir);
}

function main() {
  const args = process.argv.slice(2);
  let k6Executable;

  try {
    k6Executable = resolveK6Executable();
  } catch (err) {
    console.error('⚠️  Failed to resolve k6 binary:', err.message);
    process.exit(1);
  }

  const isDirectCmd = args.length > 0 && ['version', '--version', '-v', '--help', '-h'].includes(args[0]);
  const k6Args = isDirectCmd || (args.length > 0 && args[0] === 'run') ? args : ['run', ...args];

  console.log(`🚀 Executing: ${k6Executable} ${k6Args.join(' ')}`);
  const child = spawn(k6Executable, k6Args, {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main();
