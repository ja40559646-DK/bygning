function assertNonEmpty(value, field) {
  if (!String(value || '').trim()) {
    throw new Error(`${field} er påkrævet.`);
  }
}

export function buildRolloutPlan({ version, environment, steps }) {
  assertNonEmpty(version, 'Version');
  assertNonEmpty(environment, 'Miljø');

  const normalizedSteps = Array.isArray(steps) ? steps.map((step, index) => ({
    id: `S${index + 1}`,
    name: String(step || '').trim()
  })).filter((item) => item.name) : [];

  if (normalizedSteps.length === 0) {
    throw new Error('Der skal være mindst ét rollout-step.');
  }

  return {
    version: String(version).trim(),
    environment: String(environment).trim(),
    steps: normalizedSteps,
    generatedAt: new Date().toISOString()
  };
}

export function evaluateRolloutReadiness({ plan, checks }) {
  if (!plan || !Array.isArray(plan.steps)) {
    throw new Error('Rollout-plan er ugyldig.');
  }

  const normalizedChecks = {
    backup: Boolean(checks?.backup),
    rollback: Boolean(checks?.rollback),
    monitoring: Boolean(checks?.monitoring)
  };

  const ready = Object.values(normalizedChecks).every(Boolean) && plan.steps.length > 0;

  return {
    planVersion: plan.version,
    checks: normalizedChecks,
    ready,
    recommendedAction: ready ? 'deploy' : 'hold'
  };
}
