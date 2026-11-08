import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import path from 'node:path';
import { maestroEnvArgs } from './maestro-env';

/**
 * Runs the Maestro flows with the contract variables.
 * Extra arguments are passed through, e.g. `npm run test:maestro -- --format junit --output report.xml`.
 * BACKEND_URL defaults to http://localhost:4000 (use `adb reverse tcp:4000 tcp:4000` on an emulator).
 */
export const flowsRoot = path.join(path.dirname(__dirname), 'maestro');

const COMMAND_NOT_FOUND = [9009, 127];

/** Maestro is a .bat file on Windows, which only starts through a shell, so spaces need quoting there. */
function spawnTool(tool: string, args: string[], options: SpawnSyncOptions) {
  const isWindows = process.platform === 'win32';
  const finalArgs = isWindows ? args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)) : args;
  const result = spawnSync(tool, finalArgs, { ...options, shell: isWindows });
  return { result, missing: Boolean(result.error) || COMMAND_NOT_FOUND.includes(result.status ?? -1) };
}

export function captureTool(tool: string, args: string[]): { error: boolean; stdout: string } {
  const { result, missing } = spawnTool(tool, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return { error: missing, stdout: String(result.stdout ?? '') };
}

export function runMaestro(backendUrl: string, options: string[], targets: string[]): number {
  const args = ['test', ...maestroEnvArgs(backendUrl), ...options, ...targets];
  const { result, missing } = spawnTool('maestro', args, { stdio: 'inherit' });
  if (missing) {
    process.stderr.write('Could not start Maestro. Install it from https://maestro.dev\n');
    return 1;
  }
  return result.status ?? 1;
}

if (require.main === module) {
  process.exit(runMaestro(process.env.BACKEND_URL ?? 'http://localhost:4000', process.argv.slice(2), [flowsRoot]));
}
