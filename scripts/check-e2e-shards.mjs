import { spawnSync } from 'node:child_process';
import { verifyPartition } from './e2e-shard-validation.mjs';

const shardCount = Number(process.env.E2E_SHARDS ?? 4);
if (!Number.isInteger(shardCount) || shardCount < 1 || shardCount > 32)
  throw new Error('E2E_SHARDS должен быть целым числом от 1 до 32.');

function collect(shard) {
  const args = ['node_modules/@playwright/test/cli.js', 'test', '--list', '--reporter=json'];
  if (shard) args.push(`--shard=${shard}/${shardCount}`);
  // Use CI settings for discovery: the partition must match the real CI run.
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    env: { ...process.env, CI: '1' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Playwright --list завершился с ${result.status}: ${result.stderr}`);
  const report = JSON.parse(result.stdout);
  if (report.errors?.length)
    throw new Error(`Ошибка обнаружения тестов: ${JSON.stringify(report.errors)}`);
  function visit(suite) {
    return [
      ...(suite.specs ?? []).flatMap((spec) =>
        spec.tests.map((test) => `${spec.id}|${test.projectId}`),
      ),
      ...(suite.suites ?? []).flatMap(visit),
    ];
  }
  return (report.suites ?? []).flatMap(visit);
}
const all = collect();
const shards = Array.from({ length: shardCount }, (_, i) => collect(i + 1));
verifyPartition(all, shards);
console.log(
  `Проверены ${all.length} браузерных тестов: ${shards.map((s) => s.length).join(' + ')}; каждый выполняется ровно в одной части.`,
);
