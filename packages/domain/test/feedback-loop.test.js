import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePilotKpis, prioritizeFeedback, submitFeedback } from '../src/feedback-loop.js';

test('submitFeedback creates feedback item', () => {
  const item = submitFeedback({ title: 'UI knap uklar', category: 'ux', severity: 2 });
  assert.match(item.id, /^FDB-/);
  assert.equal(item.status, 'new');
});

test('prioritizeFeedback ranks error above ux by score', () => {
  const ux = submitFeedback({ title: 'UX ting', category: 'ux', severity: 5 });
  const err = submitFeedback({ title: 'Fejl i flow', category: 'error', severity: 3 });
  const prioritized = prioritizeFeedback([ux, err]);

  assert.equal(prioritized.top.category, 'error');
  assert.ok(prioritized.ranked[0].priorityScore >= prioritized.ranked[1].priorityScore);
});

test('calculatePilotKpis computes activation completion and error rates', () => {
  const kpi = calculatePilotKpis({
    sessions: [
      { activated: true, completedFlow: true },
      { activated: true, completedFlow: false },
      { activated: false, completedFlow: false }
    ],
    feedbackItems: [
      { category: 'error' },
      { category: 'ux' }
    ]
  });

  assert.ok(Math.abs(kpi.activationRate - 2 / 3) < 1e-9);
  assert.ok(Math.abs(kpi.completionRate - 1 / 3) < 1e-9);
  assert.ok(Math.abs(kpi.errorRate - 1 / 2) < 1e-9);
});
