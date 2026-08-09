import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';

export default async function startNativeServer() {
  const executable = resolve('backend', 'build', process.platform === 'win32' ? 'unspool_server.exe' : 'unspool_server');
  const child = spawn(executable, ['--port', '4199', '--static-root', 'build'], { stdio: 'ignore', windowsHide: true });
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Native test server exited with code ${child.exitCode}`);
    try {
      const response = await fetch('http://127.0.0.1:4199/healthz');
      if (response.ok && (await response.json()).runtime === 'c++23') break;
    } catch { /* server is still starting */ }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  try {
    const response = await fetch('http://127.0.0.1:4199/healthz');
    if (!response.ok || (await response.json()).runtime !== 'c++23') throw new Error('Unexpected health response');
  } catch (error) {
    child.kill();
    throw new Error(`Native C++23 test server did not become ready: ${error instanceof Error ? error.message : String(error)}`);
  }
  return async () => {
    if (child.exitCode !== null) return;
    child.kill();
    await Promise.race([once(child, 'exit'), new Promise((resolveDelay) => setTimeout(resolveDelay, 3_000))]);
  };
}
