import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePolygonArea, createWorkArea, validatePolygon } from '../src/site-planning.js';

const rectangle = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 5 },
  { x: 0, y: 5 }
];

test('validatePolygon accepts valid polygon', () => {
  const result = validatePolygon(rectangle);
  assert.equal(result.valid, true);
});

test('calculatePolygonArea computes expected area', () => {
  assert.equal(calculatePolygonArea(rectangle), 50);
});

test('createWorkArea returns named area', () => {
  const area = createWorkArea('Hovedhus', rectangle);
  assert.equal(area.name, 'Hovedhus');
  assert.equal(area.areaM2, 50);
});
