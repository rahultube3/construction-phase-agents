import { spawn, ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import autocannon, { Result } from 'autocannon';

const ROOT: string = path.resolve(__dirname, '..', '..');
const PORT: number = Number(process.env.PORT ?? 3100);
const URL: string = `http://127.0.0.1:${PORT}/employees`;

const BUDGET = {
  p95Ms: 200,
  targetRps: 100,
  connections: 10,
  maxErrorRate: 0,
};

const WARMUP_SECONDS = 5;
const RUN_SECONDS = 30;

async function waitForReady(timeoutMs: number): Promise<void> {
  const deadline: number = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res: Response = await fetch(URL);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`App did not become ready at ${URL} within ${timeoutMs}ms`);
}

function run(durationSeconds: number): Promise<Result> {
  return autocannon({
    url: URL,
    connections: BUDGET.connections,
    overallRate: BUDGET.targetRps,
    duration: durationSeconds,
  });
}

async function main(): Promise<void> {
  const app: ChildProcess = spawn('node', ['dist/main'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'ignore',
  });

  try {
    await waitForReady(15_000);

    console.log(`Warm-up: ${WARMUP_SECONDS}s @ ${BUDGET.targetRps} RPS ...`);
    await run(WARMUP_SECONDS);

    console.log(`Measured run: ${RUN_SECONDS}s @ ${BUDGET.targetRps} RPS, ${BUDGET.connections} connections ...`);
    const result: Result = await run(RUN_SECONDS);

    const totalErrors: number = result.errors + result.timeouts + result.non2xx;
    // autocannon reports p97.5, not p95; p97.5 < budget implies p95 < budget.
    const pass: boolean = result.latency.p97_5 < BUDGET.p95Ms && totalErrors === 0;

    console.log('\n=== GET /employees — raw autocannon result ===');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n=== Summary ===');
    console.log(`RPS achieved : ${result.requests.average}`);
    console.log(`Latency p50  : ${result.latency.p50} ms`);
    console.log(`Latency p97.5: ${result.latency.p97_5} ms (budget p95 < ${BUDGET.p95Ms} ms; p97.5 used as stricter proxy)`);
    console.log(`Latency p99  : ${result.latency.p99} ms`);
    console.log(`Errors       : ${result.errors} | Timeouts: ${result.timeouts} | Non-2xx: ${result.non2xx}`);
    console.log(`Verdict      : ${pass ? 'PASS' : 'FAIL'}`);

    process.exitCode = pass ? 0 : 1;
  } finally {
    app.kill('SIGTERM');
  }
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
