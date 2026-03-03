const COMBINATION_PROFILES = {
  dkNaBasic: {
    id: 'dkNaBasic',
    name: 'DK NA basic (ULS/SLS)',
    combinations: {
      uls: { gammaG: 1.35, gammaQ: 1.5 },
      sls: { gammaG: 1.0, gammaQ: 1.0 }
    }
  }
};

function assertPositive(value, fieldName) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} skal være et positivt tal.`);
  }
}

function assertNonNegative(value, fieldName) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} skal være nul-eller-positivt.`);
  }
}

function normalizeDirection(direction) {
  const allowed = ['x', 'y', 'z+', 'z-'];
  const normalized = String(direction || '').trim();
  if (!allowed.includes(normalized)) {
    throw new Error('Retning skal være en af: x, y, z+, z-.');
  }
  return normalized;
}

function getProfile(profileId) {
  const profile = COMBINATION_PROFILES[profileId || 'dkNaBasic'];
  if (!profile) {
    throw new Error('Ukendt kombinationsprofil.');
  }
  return profile;
}

function normalizeComponent(component, index) {
  const id = String(component?.id || `C${index + 1}`);
  const direction = normalizeDirection(component?.direction || 'z-');
  const areaM2 = Number(component?.areaM2);
  const loadKnPerM2 = Number(component?.loadKnPerM2);
  const tributaryWidthM = Number(component?.tributaryWidthM);
  const influenceAreaM2 = Number(component?.influenceAreaM2);
  const variableLoadKn = Number(component?.variableLoadKn ?? 0);

  assertPositive(areaM2, `Areal (${id})`);
  assertPositive(loadKnPerM2, `Areal-last (${id})`);
  assertPositive(tributaryWidthM, `Tributær bredde (${id})`);
  assertPositive(influenceAreaM2, `Influensareal (${id})`);
  assertNonNegative(variableLoadKn, `Variabel last (${id})`);

  const areaLoadKn = areaM2 * loadKnPerM2;
  const lineLoadKnPerM = loadKnPerM2 * tributaryWidthM;
  const pointLoadKn = loadKnPerM2 * influenceAreaM2;

  return {
    id,
    direction,
    inputs: {
      areaM2,
      loadKnPerM2,
      tributaryWidthM,
      influenceAreaM2,
      variableLoadKn
    },
    results: {
      areaLoadKn,
      lineLoadKnPerM,
      pointLoadKn
    },
    trace: [
      `${id}: areaLoadKn = ${areaM2} * ${loadKnPerM2} = ${areaLoadKn}`,
      `${id}: lineLoadKnPerM = ${loadKnPerM2} * ${tributaryWidthM} = ${lineLoadKnPerM}`,
      `${id}: pointLoadKn = ${loadKnPerM2} * ${influenceAreaM2} = ${pointLoadKn}`
    ]
  };
}

function aggregateByDirection(componentResults) {
  const totals = {
    x: { areaLoadKn: 0, lineLoadKnPerM: 0, pointLoadKn: 0, variableLoadKn: 0 },
    y: { areaLoadKn: 0, lineLoadKnPerM: 0, pointLoadKn: 0, variableLoadKn: 0 },
    'z+': { areaLoadKn: 0, lineLoadKnPerM: 0, pointLoadKn: 0, variableLoadKn: 0 },
    'z-': { areaLoadKn: 0, lineLoadKnPerM: 0, pointLoadKn: 0, variableLoadKn: 0 }
  };

  for (const entry of componentResults) {
    const bucket = totals[entry.direction];
    bucket.areaLoadKn += entry.results.areaLoadKn;
    bucket.lineLoadKnPerM += entry.results.lineLoadKnPerM;
    bucket.pointLoadKn += entry.results.pointLoadKn;
    bucket.variableLoadKn += entry.inputs.variableLoadKn;
  }

  return totals;
}

function buildCombinations(profile, directionTotals) {
  const combinations = {};

  for (const [direction, totals] of Object.entries(directionTotals)) {
    const uls =
      profile.combinations.uls.gammaG * totals.areaLoadKn +
      profile.combinations.uls.gammaQ * totals.variableLoadKn;
    const sls =
      profile.combinations.sls.gammaG * totals.areaLoadKn +
      profile.combinations.sls.gammaQ * totals.variableLoadKn;

    combinations[direction] = {
      ulsKn: uls,
      slsKn: sls
    };
  }

  return combinations;
}

export function listCombinationProfiles() {
  return Object.values(COMBINATION_PROFILES).map((profile) => ({
    id: profile.id,
    name: profile.name,
    combinations: profile.combinations
  }));
}

export function runCalculationEngine({ components, profileId = 'dkNaBasic' }) {
  if (!Array.isArray(components) || components.length === 0) {
    throw new Error('Der skal angives mindst én komponent.');
  }

  const profile = getProfile(profileId);
  const componentResults = components.map((component, index) => normalizeComponent(component, index));
  const directionTotals = aggregateByDirection(componentResults);
  const combinations = buildCombinations(profile, directionTotals);

  return {
    profile: {
      id: profile.id,
      name: profile.name
    },
    componentResults,
    directionTotals,
    combinations,
    traceability: {
      sources: ['PRODUKTIONSPLAN fase 6', 'dkNaBasic profile'],
      formulas: [
        'areaLoadKn = areaM2 * loadKnPerM2',
        'lineLoadKnPerM = loadKnPerM2 * tributaryWidthM',
        'pointLoadKn = loadKnPerM2 * influenceAreaM2',
        'ULS = gammaG*Gk + gammaQ*Qk',
        'SLS = gammaG*Gk + gammaQ*Qk'
      ],
      componentTrace: componentResults.flatMap((item) => item.trace)
    }
  };
}
