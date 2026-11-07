import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

type Step = {
  name?: string;
  uses?: string;
  run?: string;
  if?: string;
  with?: Record<string, unknown>;
};
type Job = {
  needs?: string[] | string;
  if?: string;
  permissions?: Record<string, string>;
  strategy?: { matrix: { shard: number[] }; 'fail-fast': boolean };
  steps: Step[];
};
const workflow = parse(readFileSync('.github/workflows/check.yml', 'utf8')) as {
  on: Record<string, unknown> & { push: { branches: string[] } };
  env: { E2E_SHARDS: string };
  concurrency: { group: string; 'cancel-in-progress': boolean };
  jobs: Record<string, Job>;
};
const stepUsing = (job: Job, action: string) =>
  job.steps.find((step) => step.uses?.startsWith(action));

describe('CI and deployment safety', () => {
  it('avoids duplicate push runs for pull requests and cancels superseded runs', () => {
    expect(workflow.on).toHaveProperty('pull_request');
    expect(workflow.on.push.branches).toEqual(['main']);
    expect(workflow.on).toHaveProperty('workflow_dispatch');
    expect(workflow.concurrency['cancel-in-progress']).toBe(true);
    expect(workflow.concurrency.group).toContain('github.event.pull_request.number');
    expect(existsSync('.github/workflows/deploy.yml')).toBe(false);
  });
  it('runs all checks and verifies an exact, disjoint partition before running shards', () => {
    const { build, e2e, check } = workflow.jobs;
    const commands = build.steps.map((step) => step.run);
    expect(commands).toEqual(
      expect.arrayContaining([
        'npm ci',
        'npm run format:check',
        'npm run check',
        'npm audit --omit=dev',
        'npm run test:e2e:shards:check',
      ]),
    );
    expect(stepUsing(build, 'actions/upload-artifact@')?.with).toMatchObject({
      name: 'checked-build',
      path: 'dist/',
      'if-no-files-found': 'error',
    });
    expect(e2e.needs).toBe('build');
    expect(e2e.strategy?.['fail-fast']).toBe(false);
    expect(e2e.strategy?.matrix.shard).toEqual(
      Array.from({ length: Number(workflow.env.E2E_SHARDS) }, (_, i) => i + 1),
    );
    expect(stepUsing(e2e, 'actions/download-artifact@')?.with).toMatchObject({
      name: 'checked-build',
      path: 'dist/',
    });
    expect(e2e.steps.some((step) => step.run?.includes('playwright test --shard='))).toBe(true);
    expect(check.needs).toEqual(['build', 'e2e']);
    expect(check.if).toBe('always()');
    expect(check.steps[0].run).toContain('"$BUILD_RESULT" = success');
    expect(check.steps[0].run).toContain('"$E2E_RESULT" = success');
  });
  it('only deploys the tested artifact from a successful main run', () => {
    const { deploy } = workflow.jobs;
    expect(deploy.needs).toEqual(['check']);
    expect(deploy.if).toContain("github.ref == 'refs/heads/main'");
    expect(deploy.if).toContain("github.event_name != 'pull_request'");
    expect(deploy.permissions).toMatchObject({ pages: 'write', 'id-token': 'write' });
    expect(stepUsing(deploy, 'actions/download-artifact@')?.with).toMatchObject({
      name: 'checked-build',
      path: 'dist/',
    });
    expect(
      deploy.steps.some(
        (step) => step.run?.includes('/git/ref/heads/main') && step.run.includes('$GITHUB_SHA'),
      ),
    ).toBe(true);
    expect(stepUsing(deploy, 'actions/upload-pages-artifact@')?.with).toMatchObject({
      path: 'dist/',
    });
    expect(stepUsing(deploy, 'actions/deploy-pages@')).toBeDefined();
  });
});
