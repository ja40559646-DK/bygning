function assertNonEmpty(value, field) {
  if (!String(value || '').trim()) {
    throw new Error(`${field} er påkrævet.`);
  }
}

export function createReferenceCase({ name, category, expectedResult }) {
  assertNonEmpty(name, 'Navn');
  assertNonEmpty(category, 'Kategori');

  return {
    id: `RC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    name: String(name).trim(),
    category: String(category).trim(),
    expectedResult: Number.isFinite(Number(expectedResult)) ? Number(expectedResult) : expectedResult,
    createdAt: new Date().toISOString()
  };
}

export function validateReferenceCase(referenceCase, actualResult) {
  if (!referenceCase || !referenceCase.id) {
    throw new Error('Referencecase er ugyldig.');
  }

  const expected = Number(referenceCase.expectedResult);
  const actual = Number(actualResult);
  if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
    throw new Error('Expected og actual resultat skal være numeriske værdier.');
  }

  const delta = actual - expected;
  const passed = Math.abs(delta) < 1e-9;

  return {
    referenceCaseId: referenceCase.id,
    expected,
    actual,
    delta,
    passed
  };
}
