import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { API_ROUTES, MOBILE_APP_ID } from '@buggybooks/contracts';
import { captureTool, flowsRoot, runMaestro } from './run-maestro';

/**
 * Runs Maestro flows on a local emulator with one command, starting the backend if needed.
 *
 *   npm run e2e:local                       every flow
 *   npm run e2e:local -- smoke_login        one flow, by file name
 *   npm run e2e:local -- --include-tags=auth    any other argument goes to Maestro
 */
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';
const repoRoot = path.resolve(__dirname, '..', '..');
const BACKEND_START_TIMEOUT_MS = 60_000;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function backendIsUp(): Promise<boolean> {
  try {
    return (await fetch(`${backendUrl}${API_ROUTES.health.path}`)).ok;
  } catch {
    return false;
  }
}

async function startBackend(): Promise<ChildProcess> {
  process.stdout.write('Starting the backend...\n');
  const isWindows = process.platform === 'win32';
  const child = spawn('npm', ['run', 'dev:backend'], { cwd: repoRoot, stdio: 'ignore', shell: isWindows, detached: !isWindows });
  const deadline = Date.now() + BACKEND_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await backendIsUp()) return child;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  stopBackend(child);
  return fail(`The backend did not answer on ${backendUrl} within ${BACKEND_START_TIMEOUT_MS / 1000}s. Try: npm run dev:backend`);
}

function stopBackend(child: ChildProcess): void {
  if (child.pid === undefined) return;
  if (process.platform === 'win32') {
    captureTool('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  } else {
    process.kill(-child.pid, 'SIGTERM');
  }
}

function checkDevice(): void {
  const state = captureTool('adb', ['get-state']);
  if (state.error) fail('adb was not found. Add the Android SDK platform-tools folder to PATH (see README, "Testing the Android app locally").');
  if (state.stdout.trim() !== 'device') fail('No emulator is running. Start one from Android Studio > Device Manager.');

  const packages = captureTool('adb', ['shell', 'pm', 'list', 'packages', MOBILE_APP_ID]);
  if (!packages.stdout.includes(MOBILE_APP_ID)) fail('The app is not installed. Run: npm run android:release --workspace=mobile');
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const flows = args.filter((arg) => !arg.startsWith('-')).map((name) => path.join(flowsRoot, 'flows', `${name.replace(/\.yaml$/, '')}.yaml`));
  const options = args.filter((arg) => arg.startsWith('-'));

  checkDevice();
  captureTool('adb', ['reverse', 'tcp:4000', 'tcp:4000']);

  const backend = (await backendIsUp()) ? null : await startBackend();
  try {
    return runMaestro(backendUrl, options, flows.length > 0 ? flows : [flowsRoot]);
  } finally {
    if (backend) stopBackend(backend);
  }
}

main().then((code) => process.exit(code));
