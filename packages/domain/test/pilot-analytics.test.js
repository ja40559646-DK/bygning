import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotTrendSeries, detectPilotAlerts } from '../src/pilot-analytics.js';

test('buildPilotTrendSeries normalizes entries', () => {
  const series = buildPilotTrendSeries([{ day: 'D1', activationRate: 0.7, completionRate: 0.6, errorRate: 0.1 }]);
  assert.equal(series[0].day, 'D1');
  assert.equal(series[0].activationRate, 0.7);
});

test('detectPilotAlerts triggers low-activation and high-error alerts', () => {
  const result = detectPilotAlerts([
    { day: 'D1', activationRate: 0.4, completionRate: 0.7, errorRate: 0.3 }
  ]);

  assert.equal(result.hasAlerts, true);
  assert.ok(result.alerts.some((item) => item.type === 'low-activation'));
  assert.ok(result.alerts.some((item) => item.type === 'high-error-rate'));
});
