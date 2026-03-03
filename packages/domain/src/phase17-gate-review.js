function toBool(value) {
  return Boolean(value);
}

export function evaluateGateReview({ gateId, checklist }) {
  if (!String(gateId || '').trim()) {
    throw new Error('Gate-id er påkrævet.');
  }

  const normalized = {
    tests: toBool(checklist?.tests),
    security: toBool(checklist?.security),
    lint: toBool(checklist?.lint),
    docs: toBool(checklist?.docs)
  };

  const passed = Object.values(normalized).every(Boolean);

  return {
    gateId: String(gateId).trim(),
    checklist: normalized,
    passed,
    decision: passed ? 'approved' : 'blocked',
    generatedAt: new Date().toISOString()
  };
}
