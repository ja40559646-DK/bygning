import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectLoadLineConflicts,
  previewLoadLineWorkflow,
  projectLoadLines,
  validateLoadLine
} from '../src/load-lines.js';

const simpleLines = [
  {
    id: 'L1',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 }
    ]
  },
  {
    id: 'L2',
    points: [
      { x: 0, y: 4 },
      { x: 10, y: 4 }
    ]
  }
];

test('validateLoadLine normalizes id and points', () => {
  const line = validateLoadLine({ id: 'A', points: [{ x: 0, y: 0 }, { x: 2, y: 1 }] });
  assert.equal(line.id, 'A');
  assert.equal(line.points.length, 2);
});

test('projectLoadLines projects front/back with deterministic order', () => {
  const result = projectLoadLines({
    lines: [simpleLines[1], simpleLines[0]],
    envelopeDepthM: 8
  });

  assert.equal(result.projected.length, 2);
  assert.equal(result.projected[0].lineId, 'L1');
  assert.equal(result.projected[0].back[0].z, 8);
});

test('detectLoadLineConflicts finds crossing lines', () => {
  const result = detectLoadLineConflicts([
    {
      id: 'L1',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ]
    },
    {
      id: 'L2',
      points: [
        { x: 0, y: 10 },
        { x: 10, y: 0 }
      ]
    }
  ]);

  assert.equal(result.isValid, false);
  assert.equal(result.conflicts[0].type, 'crossing-lines');
});

test('detectLoadLineConflicts flags broken zero-length segment', () => {
  const result = detectLoadLineConflicts([
    {
      id: 'L1',
      points: [
        { x: 2, y: 2 },
        { x: 2, y: 2 }
      ]
    }
  ]);

  assert.equal(result.isValid, false);
  assert.equal(result.conflicts[0].type, 'broken-segment');
});

test('previewLoadLineWorkflow returns projection and validation', () => {
  const result = previewLoadLineWorkflow({
    lines: simpleLines,
    envelopeDepthM: 12
  });

  assert.equal(result.projection.projected.length, 2);
  assert.equal(result.validation.isValid, true);
});
