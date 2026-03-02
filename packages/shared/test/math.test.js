import test from 'node:test';
import assert from 'node:assert/strict';
import { areaRectangle, sum } from '../src/math.js';

test('sum returns added values', () => {
  assert.equal(sum(2, 3), 5);
});

test('areaRectangle returns area for positive values', () => {
  assert.equal(areaRectangle(10, 5), 50);
});

test('areaRectangle rejects invalid dimensions', () => {
  assert.throws(() => areaRectangle(0, 5), /positive numbers/);
});
