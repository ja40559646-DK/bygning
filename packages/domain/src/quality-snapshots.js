function assertObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} skal være et objekt.`);
  }
}

export function createQualitySnapshot({ name, metrics }) {
  if (!String(name || '').trim()) {
    throw new Error('Snapshot-navn er påkrævet.');
  }
  assertObject(metrics, 'Metrics');

  return {
    id: `QSNAP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    name: String(name).trim(),
    metrics: {
      testPassRate: Number(metrics.testPassRate ?? 0),
      lintPassRate: Number(metrics.lintPassRate ?? 0),
      securityPassRate: Number(metrics.securityPassRate ?? 0),
      avgResponseMs: Number(metrics.avgResponseMs ?? 0)
    },
    createdAt: new Date().toISOString()
  };
}

export function compareQualitySnapshots(base, candidate) {
  assertObject(base, 'Base snapshot');
  assertObject(candidate, 'Candidate snapshot');

  const delta = {
    testPassRate: candidate.metrics.testPassRate - base.metrics.testPassRate,
    lintPassRate: candidate.metrics.lintPassRate - base.metrics.lintPassRate,
    securityPassRate: candidate.metrics.securityPassRate - base.metrics.securityPassRate,
    avgResponseMs: candidate.metrics.avgResponseMs - base.metrics.avgResponseMs
  };

  return {
    base: { id: base.id, name: base.name },
    candidate: { id: candidate.id, name: candidate.name },
    delta,
    regressionRisk: delta.testPassRate < 0 || delta.lintPassRate < 0 || delta.securityPassRate < 0 || delta.avgResponseMs > 0
  };
}
