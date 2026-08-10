const bun = Bun.which('bun') ?? process.execPath;
const scripts = ['dev:frontend', 'dev:backend', 'dev:worker'] as const;
const children = scripts.map((script) => ({
  script,
  process: Bun.spawn([bun, 'run', script], {
    cwd: import.meta.dir + '/..',
    env: process.env,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }),
}));

let closing = false;

async function close(exitCode: number): Promise<never> {
  if (!closing) {
    closing = true;
    for (const child of children) {
      if (child.process.exitCode === null) child.process.kill();
    }
  }

  await Promise.allSettled(children.map((child) => child.process.exited));
  process.exit(exitCode);
}

process.once('SIGINT', () => void close(0));
process.once('SIGTERM', () => void close(0));

for (const child of children) {
  void child.process.exited.then((exitCode) => {
    if (!closing) {
      if (exitCode !== 0) console.error(`${child.script} exited with code ${exitCode}.`);
      void close(exitCode);
    }
  });
}

await Promise.all(children.map((child) => child.process.exited));
