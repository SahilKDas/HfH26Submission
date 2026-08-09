import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const buildDir = resolve(root, 'backend', 'build');
const executable = resolve(buildDir, process.platform === 'win32' ? 'unspool_server.exe' : 'unspool_server');
const testExecutable = resolve(buildDir, process.platform === 'win32' ? 'unspool_backend_tests.exe' : 'unspool_backend_tests');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function configure() {
  const args = ['-S', 'backend', '-B', 'backend/build', '-DCMAKE_BUILD_TYPE=Release'];
  if (process.platform === 'win32') args.push('-G', 'MinGW Makefiles');
  run('cmake', args);
}

function build() {
  if (!existsSync(resolve(buildDir, 'CMakeCache.txt'))) configure();
  run('cmake', ['--build', 'backend/build', '--config', 'Release']);
}

function test() {
  if (!existsSync(testExecutable)) build();
  run('ctest', ['--test-dir', 'backend/build', '-C', 'Release', '--output-on-failure']);
}

function runServer(args) {
  const child = spawn(executable, args, { cwd: root, stdio: 'inherit', shell: false });
  const stop = (signal) => { if (!child.killed) child.kill(signal); };
  process.once('SIGINT', () => stop('SIGINT'));
  process.once('SIGTERM', () => stop('SIGTERM'));
  child.once('error', (error) => { console.error(error); process.exit(1); });
  child.once('exit', (code) => process.exit(code ?? 0));
}

const [action = 'run', ...forwarded] = process.argv.slice(2);
if (action === 'configure') configure();
else if (action === 'build') build();
else if (action === 'test') test();
else if (action === 'check') { configure(); build(); test(); }
else if (action === 'run') {
  if (!existsSync(executable)) build();
  const serverArgs = forwarded.length > 0 && !forwarded[0].startsWith('--')
    ? ['--port', forwarded[0], '--static-root', forwarded[1] ?? 'build']
    : forwarded;
  runServer(serverArgs);
} else {
  console.error(`Unknown backend action: ${action}`);
  process.exit(2);
}
