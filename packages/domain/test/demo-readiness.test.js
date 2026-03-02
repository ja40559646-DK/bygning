import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhaseStatus, getTryNowGuide } from '../src/demo-readiness.js';

test('getPhaseStatus reports phase 9 and 10 as completed', () => {
  const status = getPhaseStatus();
  const phase9 = status.phases.find((item) => item.phase === 9);
  const phase10 = status.phases.find((item) => item.phase === 10);

  assert.equal(phase9.status, 'completed');
  assert.equal(phase10.status, 'completed');
  assert.equal(status.readyForPilot, true);
});

test('getTryNowGuide includes local entrypoint and steps', () => {
  const guide = getTryNowGuide();
  assert.equal(guide.entrypoint, 'http://localhost:3000');
  assert.ok(guide.steps.length >= 3);
});
