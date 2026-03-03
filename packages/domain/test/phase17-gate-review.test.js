import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGateReview } from '../src/phase17-gate-review.js';

test('evaluateGateReview approves when all checks pass', () => {
  const result = evaluateGateReview({
    gateId: 'G9',
    checklist: { tests: true, security: true, lint: true, docs: true }
  });

  assert.equal(result.passed, true);
  assert.equal(result.decision, 'approved');
});

test('evaluateGateReview blocks when one check fails', () => {
  const result = evaluateGateReview({
    gateId: 'G9',
    checklist: { tests: true, security: false, lint: true, docs: true }
  });

  assert.equal(result.passed, false);
  assert.equal(result.decision, 'blocked');
});
