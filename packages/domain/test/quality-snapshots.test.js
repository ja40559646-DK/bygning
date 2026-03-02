import test from 'node:test';
import assert from 'node:assert/strict';
import { compareQualitySnapshots, createQualitySnapshot } from '../src/quality-snapshots.js';

test('createQualitySnapshot stores metric payload', () => {
  const snapshot = createQualitySnapshot({
    name: 'baseline',
    metrics: { testPassRate: 1, lintPassRate: 1, securityPassRate: 1, avgResponseMs: 120 }
  });

  assert.match(snapshot.id, /^QSNAP-/);
  assert.equal(snapshot.metrics.avgResponseMs, 120);
});

test('compareQualitySnapshots flags regression on slower response', () => {
  const base = createQualitySnapshot({
    name: 'base',
    metrics: { testPassRate: 1, lintPassRate: 1, securityPassRate: 1, avgResponseMs: 100 }
  });
  const candidate = createQualitySnapshot({
    name: 'candidate',
    metrics: { testPassRate: 1, lintPassRate: 1, securityPassRate: 1, avgResponseMs: 130 }
  });

  const diff = compareQualitySnapshots(base, candidate);
  assert.equal(diff.regressionRisk, true);
  assert.equal(diff.delta.avgResponseMs, 30);
});
