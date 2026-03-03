import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRolloutPlan, evaluateRolloutReadiness } from '../src/phase18-rollout.js';

test('buildRolloutPlan returns normalized steps', () => {
  const plan = buildRolloutPlan({ version: '2.0.0', environment: 'staging', steps: ['Backup', 'Deploy', 'Verify'] });
  assert.equal(plan.steps.length, 3);
  assert.equal(plan.steps[0].id, 'S1');
});

test('evaluateRolloutReadiness returns deploy when all checks pass', () => {
  const plan = buildRolloutPlan({ version: '2.0.0', environment: 'staging', steps: ['Backup', 'Deploy', 'Verify'] });
  const readiness = evaluateRolloutReadiness({
    plan,
    checks: { backup: true, rollback: true, monitoring: true }
  });

  assert.equal(readiness.ready, true);
  assert.equal(readiness.recommendedAction, 'deploy');
});
