import test from 'node:test';
import assert from 'node:assert/strict';
import {
  closeIncident,
  createIncident,
  evaluateDrillReadiness,
  summarizeOperations
} from '../src/operations.js';

test('createIncident creates open incident', () => {
  const incident = createIncident({ title: 'API timeout', severity: 'high', service: 'api' });
  assert.match(incident.id, /^INC-/);
  assert.equal(incident.status, 'open');
});

test('closeIncident marks incident as closed', () => {
  const incident = createIncident({ title: 'Queue delay', service: 'worker' });
  const closed = closeIncident(incident, 'Restarted worker');
  assert.equal(closed.status, 'closed');
  assert.equal(closed.resolutionNote, 'Restarted worker');
});

test('summarizeOperations blocks go-live on critical open incidents', () => {
  const incident = createIncident({ title: 'DB down', severity: 'critical', service: 'db' });
  const summary = summarizeOperations({
    incidents: [incident],
    checks: { security: true, tests: true, backups: true, monitoring: true, rollbackPlan: true }
  });

  assert.equal(summary.goLiveReady, false);
  assert.equal(summary.incidents.criticalOpen, 1);
});

test('evaluateDrillReadiness returns ready when all checks pass', () => {
  const drill = evaluateDrillReadiness({ backupRestoreOk: true, failoverOk: true, alertingOk: true });
  assert.equal(drill.readinessLevel, 'ready');
  assert.equal(drill.score, 3);
});
