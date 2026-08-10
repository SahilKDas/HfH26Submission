import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

function findPython() {
  const venv = resolve('.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  if (existsSync(venv)) return venv;
  return process.platform === 'win32' ? 'py' : 'python3';
}

export default async function startDjangoStack() {
  const python = findPython();
  const database = resolve('.tmp', 'e2e.sqlite3');
  rmSync(database, { force: true });
  const env = { ...process.env, UNSPOOL_TEST_SQLITE: '1', UNSPOOL_SQLITE_PATH: database, UNSPOOL_STATIC_ROOT: resolve('build'), DJANGO_DEBUG: '1' };
  const prefix = python === 'py' ? ['-3.13'] : [];
  const migration = spawnSync(python, [...prefix, resolve('backend', 'manage.py'), 'migrate', '--noinput'], { env, stdio: 'pipe', windowsHide: true });
  if (migration.status !== 0) throw new Error(`Django migration failed: ${migration.stderr?.toString()}`);
  const server = spawn(python, [...prefix, resolve('backend', 'manage.py'), 'runserver', '127.0.0.1:4199', '--noreload'], { env, stdio: 'ignore', windowsHide: true });
  const worker = spawn(python, [...prefix, resolve('backend', 'manage.py'), 'runworker', '--poll', '.1'], { env, stdio: 'ignore', windowsHide: true });
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Django test server exited with code ${server.exitCode}`);
    if (worker.exitCode !== null) throw new Error(`Model worker exited with code ${worker.exitCode}`);
    try {
      const response = await fetch('http://127.0.0.1:4199/healthz');
      if (response.ok && (await response.json()).runtime === 'django6-python3.13') break;
    } catch { /* stack is still starting */ }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  const health = await fetch('http://127.0.0.1:4199/healthz').then((response) => response.json()).catch(() => null);
  if (health?.runtime !== 'django6-python3.13') throw new Error('Django test stack did not become ready.');
  return async () => {
    for (const child of [server, worker]) if (child.exitCode === null) child.kill();
    await Promise.all([server, worker].map((child) => child.exitCode !== null ? undefined : Promise.race([once(child, 'exit'), new Promise((resolveDelay) => setTimeout(resolveDelay, 3_000))])));
  };
}
