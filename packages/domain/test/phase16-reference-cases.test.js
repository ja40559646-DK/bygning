import test from 'node:test';
import assert from 'node:assert/strict';
import { createReferenceCase, validateReferenceCase } from '../src/phase16-reference-cases.js';

test('createReferenceCase builds a reference case', () => {
  const referenceCase = createReferenceCase({ name: 'Taglast case', category: 'roof', expectedResult: 12.5 });
  assert.match(referenceCase.id, /^RC-/);
  assert.equal(referenceCase.expectedResult, 12.5);
});

test('validateReferenceCase compares expected and actual', () => {
  const referenceCase = createReferenceCase({ name: 'Gulv case', category: 'floor', expectedResult: 10 });
  const result = validateReferenceCase(referenceCase, 10);
  assert.equal(result.passed, true);
  assert.equal(result.delta, 0);
});
