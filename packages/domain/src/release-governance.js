function assertNonEmpty(value, fieldName) {
  if (!String(value || '').trim()) {
    throw new Error(`${fieldName} er påkrævet.`);
  }
}

function assertObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} skal være et objekt.`);
  }
}

export function buildReleaseCandidate({ version, environment = 'staging', calculationReport }) {
  assertNonEmpty(version, 'Version');
  assertObject(calculationReport, 'Beregningsrapport');

  return {
    version: String(version).trim(),
    environment: String(environment || 'staging').trim(),
    generatedAt: new Date().toISOString(),
    report: calculationReport,
    approvals: {
      technical: false,
      business: false
    }
  };
}

export function setReleaseApproval(candidate, { technical, business }) {
  assertObject(candidate, 'Release candidate');

  return {
    ...candidate,
    approvals: {
      technical: Boolean(technical),
      business: Boolean(business)
    }
  };
}

export function exportReleaseReport(candidate, audience = 'internal') {
  assertObject(candidate, 'Release candidate');
  const normalizedAudience = String(audience || 'internal').trim();

  if (!['internal', 'customer'].includes(normalizedAudience)) {
    throw new Error('Audience skal være internal eller customer.');
  }

  const base = {
    version: candidate.version,
    environment: candidate.environment,
    generatedAt: candidate.generatedAt,
    approvals: candidate.approvals
  };

  if (normalizedAudience === 'customer') {
    return {
      ...base,
      summary: {
        profile: candidate.report.profile,
        combinations: candidate.report.combinations
      }
    };
  }

  return {
    ...base,
    report: candidate.report,
    traceability: candidate.report.traceability
  };
}
