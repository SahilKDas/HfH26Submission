import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');

async function findPython(): Promise<string> {
  if (process.env.UNSPOOL_PYTHON) return process.env.UNSPOOL_PYTHON;

  const virtualEnvironment = resolve(
    root,
    '.venv',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
  );
  if (await Bun.file(virtualEnvironment).exists()) return virtualEnvironment;

  const systemPython = process.platform === 'win32' ? 'py' : 'python3';
  if (Bun.which(systemPython)) return systemPython;

  throw new Error('Create .venv with Python 3.13 and install requirements.txt first.');
}

const commands: Record<string, string[]> = {
  server: ['backend/manage.py', 'runserver', '127.0.0.1:8000', '--noreload'],
  worker: ['backend/manage.py', 'runworker'],
  migrate: ['backend/manage.py', 'migrate'],
  test: ['backend/manage.py', 'test', 'core.tests'],
  check: ['backend/manage.py', 'check'],
};

const mode = process.argv[2] ?? 'server';
const command = commands[mode];
if (!command) throw new Error(`Unknown backend mode: ${mode}`);

const python = await findPython();
const prefix = python === 'py' ? ['-3.13'] : [];
const env = { ...process.env };
if (mode === 'test') env.UNSPOOL_TEST_SQLITE = '1';

const child = Bun.spawn([python, ...prefix, ...command], {
  cwd: root,
  env,
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});

let stopping = false;
function stop(): void {
  if (stopping || child.exitCode !== null) return;
  stopping = true;
  child.kill();
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

const exitCode = await child.exited;
process.exit(exitCode);
