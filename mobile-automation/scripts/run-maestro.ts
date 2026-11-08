import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { maestroEnvArgs } from './maestro-env';

/**
 * Runs the Maestro flows with the contract variables.
 * Extra arguments are passed through, e.g. `npm run test:maestro -- --format junit --output report.xml`.
 * BACKEND_URL defaults to http://localhost:4000 (use `adb reverse tcp:4000 tcp:4000` on an emulator).
 */
const root = path.dirname(__dirname);
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';
const args = ['test', ...maestroEnvArgs(backendUrl), ...process.argv.slice(2), path.join(root, 'maestro')];

const result = spawnSync('maestro', args, { stdio: 'inherit' });
if (result.error) {
  process.stderr.write(`Could not start Maestro: ${result.error.message}\nInstall it from https://maestro.dev\n`);
  process.exit(1);
}
process.exit(result.status ?? 1);
