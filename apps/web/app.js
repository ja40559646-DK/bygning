async function getJson(url) {
  const response = await fetch(url);
  const body = await response.json();
  return { status: response.status, body };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const body = await response.json();
  return { status: response.status, body };
}

function setResult(elementId, value) {
  document.getElementById(elementId).textContent = JSON.stringify(value, null, 2);
}

document.getElementById('intake-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const payload = {
    customerName: formData.get('customerName'),
    projectName: formData.get('projectName'),
    customerAddress: {
      email: formData.get('email'),
      phone: formData.get('phone'),
      street: formData.get('street'),
      number: formData.get('number'),
      postalCode: formData.get('postalCode'),
      city: formData.get('city')
    },
    projectAddressSameAsCustomer: formData.get('sameAddress') === 'on'
  };

  const result = await postJson('/api/intake', payload);
  setResult('intake-result', result);
});

document.getElementById('request-code-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const result = await postJson('/api/auth/request-code', {
    email: formData.get('email')
  });

  setResult('request-code-result', result);
});

document.getElementById('verify-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const result = await postJson('/api/auth/verify', {
    email: formData.get('email'),
    code: formData.get('code')
  });

  setResult('verify-result', result);
});

document.getElementById('list-projects-btn').addEventListener('click', async () => {
  const result = await getJson('/api/projects');
  setResult('projects-result', result);
});

const workAreaCanvas = document.getElementById('work-area-canvas');
const ctx = workAreaCanvas.getContext('2d');
const workAreaPoints = [];

function drawWorkArea() {
  ctx.clearRect(0, 0, workAreaCanvas.width, workAreaCanvas.height);

  if (workAreaPoints.length === 0) {
    return;
  }

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(workAreaPoints[0].x, workAreaPoints[0].y);

  for (let index = 1; index < workAreaPoints.length; index += 1) {
    ctx.lineTo(workAreaPoints[index].x, workAreaPoints[index].y);
  }
  ctx.stroke();

  ctx.fillStyle = '#1d4ed8';
  for (const point of workAreaPoints) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

workAreaCanvas.addEventListener('click', (event) => {
  const rect = workAreaCanvas.getBoundingClientRect();
  const x = Number((event.clientX - rect.left).toFixed(1));
  const y = Number((event.clientY - rect.top).toFixed(1));
  workAreaPoints.push({ x, y });
  drawWorkArea();
});

document.getElementById('reset-work-area-btn').addEventListener('click', () => {
  workAreaPoints.length = 0;
  drawWorkArea();
  setResult('work-area-result', { status: 'nulstillet' });
});

document.getElementById('preview-work-area-btn').addEventListener('click', async () => {
  const result = await postJson('/api/work-area/preview', {
    name: 'Tegnet område',
    points: workAreaPoints
  });

  setResult('work-area-result', result);
});

async function checkApiHealth() {
  const statusElement = document.getElementById('api-status');
  const updatedElement = document.getElementById('api-status-updated');

  try {
    const result = await getJson('/health');
    const healthy = result.status === 200 && result.body.status === 'ok';

    statusElement.textContent = healthy ? 'OK' : 'FEJL';
    statusElement.className = healthy ? 'status-ok' : 'status-fail';
    updatedElement.textContent = new Date().toLocaleString('da-DK');
  } catch {
    statusElement.textContent = 'FEJL';
    statusElement.className = 'status-fail';
    updatedElement.textContent = new Date().toLocaleString('da-DK');
  }
}

document.getElementById('check-health-btn').addEventListener('click', checkApiHealth);
checkApiHealth();

document.getElementById('save-site-object-btn').addEventListener('click', async () => {
  const type = document.getElementById('site-object-type').value;
  const name = document.getElementById('site-object-name').value;

  const result = await postJson('/api/site-objects', {
    type,
    name,
    points: workAreaPoints
  });

  setResult('site-objects-result', result);
});

document.getElementById('list-site-objects-btn').addEventListener('click', async () => {
  const result = await getJson('/api/site-objects');
  setResult('site-objects-result', result);
});

document.getElementById('list-materials-btn').addEventListener('click', async () => {
  const result = await getJson('/api/materials');
  setResult('materials-result', result);
});

document.getElementById('list-load-combinations-btn').addEventListener('click', async () => {
  const result = await getJson('/api/load-combinations');
  setResult('materials-result', result);
});

document.getElementById('load-calc-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    materialId: document.getElementById('material-id').value,
    areaM2: Number(document.getElementById('area-m2').value),
    widthM: Number(document.getElementById('width-m').value),
    influenceAreaM2: Number(document.getElementById('influence-area-m2').value),
    variableLoadKn: Number(document.getElementById('variable-load-kn').value),
    combinationType: document.getElementById('combination-type').value
  };

  const result = await postJson('/api/materials/calculate-loads', payload);
  setResult('load-calculation-result', result);
});


document.getElementById('list-components-btn').addEventListener('click', async () => {
  const result = await getJson('/api/components');
  setResult('components-result', result);
});

document.getElementById('suggest-component-materials-btn').addEventListener('click', async () => {
  const componentType = document.getElementById('component-type').value;
  const result = await getJson(`/api/components/materials?componentType=${componentType}`);
  setResult('components-result', result);

  if (result.status === 200 && result.body.suggestion.defaultMaterialId) {
    document.getElementById('component-material-id').value = result.body.suggestion.defaultMaterialId;
  }
});

document.getElementById('component-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    componentType: document.getElementById('component-type').value,
    materialId: document.getElementById('component-material-id').value,
    areaM2: Number(document.getElementById('component-area-m2').value),
    variableLoadKn: Number(document.getElementById('component-variable-load-kn').value),
    combinationType: 'ulsPersistentTransient'
  };

  const result = await postJson('/api/components/estimate', payload);
  setResult('component-estimate-result', result);
});


let sandboxDraft = null;

document.getElementById('sandbox-create-btn').addEventListener('click', async () => {
  const payload = {
    componentType: document.getElementById('sandbox-component-type').value,
    areaM2: Number(document.getElementById('sandbox-area-m2').value),
    variableLoadKn: Number(document.getElementById('sandbox-variable-load-kn').value)
  };

  const result = await postJson('/api/components/sandbox/create', payload);
  if (result.status === 200) {
    sandboxDraft = result.body.draft;
  }
  setResult('sandbox-draft-result', result);
});

document.getElementById('sandbox-upsert-layer-btn').addEventListener('click', async () => {
  if (!sandboxDraft) {
    setResult('sandbox-draft-result', { status: 400, body: { error: 'Opret draft først.' } });
    return;
  }

  const result = await postJson('/api/components/sandbox/upsert-layer', {
    draft: sandboxDraft,
    layer: {
      layerId: document.getElementById('sandbox-layer-id').value,
      materialId: document.getElementById('sandbox-material-id').value,
      ratio: Number(document.getElementById('sandbox-layer-ratio').value)
    }
  });

  if (result.status === 200) {
    sandboxDraft = result.body.draft;
  }
  setResult('sandbox-draft-result', result);
});

document.getElementById('sandbox-remove-layer-btn').addEventListener('click', async () => {
  if (!sandboxDraft) {
    setResult('sandbox-draft-result', { status: 400, body: { error: 'Opret draft først.' } });
    return;
  }

  const result = await postJson('/api/components/sandbox/remove-layer', {
    draft: sandboxDraft,
    layerId: document.getElementById('sandbox-layer-id').value
  });

  if (result.status === 200) {
    sandboxDraft = result.body.draft;
  }
  setResult('sandbox-draft-result', result);
});

document.getElementById('sandbox-rollback-btn').addEventListener('click', async () => {
  if (!sandboxDraft) {
    setResult('sandbox-draft-result', { status: 400, body: { error: 'Opret draft først.' } });
    return;
  }

  const result = await postJson('/api/components/sandbox/rollback', {
    draft: sandboxDraft
  });

  if (result.status === 200) {
    sandboxDraft = result.body.draft;
  }
  setResult('sandbox-draft-result', result);
});

document.getElementById('sandbox-calc-btn').addEventListener('click', async () => {
  if (!sandboxDraft) {
    setResult('sandbox-estimate-result', { status: 400, body: { error: 'Opret draft først.' } });
    return;
  }

  const result = await postJson('/api/components/sandbox/calculate', { draft: sandboxDraft });
  setResult('sandbox-estimate-result', result);
});


document.getElementById('sandbox-list-presets-btn').addEventListener('click', async () => {
  const componentType = document.getElementById('sandbox-component-type').value;
  const result = await getJson(`/api/components/presets?componentType=${componentType}`);
  setResult('sandbox-draft-result', result);

  if (result.status === 200 && result.body.presets.presets.length > 0) {
    document.getElementById('sandbox-preset-id').value = result.body.presets.presets[0].id;
  }
});

document.getElementById('sandbox-apply-preset-btn').addEventListener('click', async () => {
  if (!sandboxDraft) {
    setResult('sandbox-draft-result', { status: 400, body: { error: 'Opret draft først.' } });
    return;
  }

  const result = await postJson('/api/components/sandbox/apply-preset', {
    draft: sandboxDraft,
    presetId: document.getElementById('sandbox-preset-id').value
  });

  if (result.status === 200) {
    sandboxDraft = result.body.draft;
  }
  setResult('sandbox-draft-result', result);
});


document.getElementById('sandbox-compare-btn').addEventListener('click', async () => {
  if (!sandboxDraft) {
    setResult('sandbox-compare-result', { status: 400, body: { error: 'Opret draft først.' } });
    return;
  }

  const rightDraftResult = await postJson('/api/components/sandbox/apply-preset', {
    draft: sandboxDraft,
    presetId: document.getElementById('sandbox-preset-id').value
  });

  if (rightDraftResult.status !== 200) {
    setResult('sandbox-compare-result', rightDraftResult);
    return;
  }

  const result = await postJson('/api/components/sandbox/compare', {
    leftDraft: sandboxDraft,
    rightDraft: rightDraftResult.body.draft
  });

  setResult('sandbox-compare-result', result);
});


document.getElementById('facade-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    buildingLengthM: Number(document.getElementById('facade-length').value),
    buildingWidthM: Number(document.getElementById('facade-width').value),
    wallHeightM: Number(document.getElementById('facade-wall-height').value),
    gableHeightM: Number(document.getElementById('facade-gable-height').value)
  };

  const result = await postJson('/api/facade/preview', payload);
  if (result.status === 200) {
    facadePreview = result.body.facade;
  }
  setResult('facade-result', result);
});


let facadePreview = null;
let gableSelection = null;
let facadeFromSelection = null;

function getCurrentPolygonOrDefault() {
  if (workAreaPoints.length >= 3) {
    return workAreaPoints;
  }

  return [
    { x: 0, y: 0 },
    { x: 12, y: 0 },
    { x: 12, y: 8 },
    { x: 0, y: 8 }
  ];
}

document.getElementById('gable-select-btn').addEventListener('click', async () => {
  const payload = {
    points: getCurrentPolygonOrDefault(),
    firstEdgeIndex: Number(document.getElementById('gable-first-edge').value),
    secondEdgeIndex: Number(document.getElementById('gable-second-edge').value),
    maxDeviationDeg: Number(document.getElementById('gable-max-deviation').value)
  };

  const result = await postJson('/api/facade/select-gable-direction', payload);
  if (result.status === 200) {
    gableSelection = result.body.selection;
  }
  setResult('gable-selection-result', result);
});

document.getElementById('gable-profile-btn').addEventListener('click', async () => {
  const spanM = gableSelection?.orientation?.spanM ?? Number(document.getElementById('facade-width').value);
  const wallHeightM = Number(document.getElementById('facade-wall-height').value);
  const ridgeHeightM = Number(document.getElementById('gable-ridge-height').value);

  const result = await postJson('/api/facade/gable-profile', {
    spanM,
    wallHeightM,
    ridgeHeightM
  });

  setResult('gable-profile-result', result);
});

document.getElementById('facade-envelope-from-selection-btn').addEventListener('click', async () => {
  if (!gableSelection) {
    setResult('facade-envelope-selection-result', {
      status: 400,
      body: { error: 'Vælg gavlretning først.' }
    });
    return;
  }

  const payload = {
    points: getCurrentPolygonOrDefault(),
    gableSelection,
    wallHeightM: Number(document.getElementById('facade-wall-height').value),
    ridgeHeightM: Number(document.getElementById('gable-ridge-height').value)
  };

  const result = await postJson('/api/facade/envelope-from-selection', payload);
  if (result.status === 200) {
    facadeFromSelection = result.body.facade;
  }
  setResult('facade-envelope-selection-result', result);
});

document.getElementById('facade-couple-sandbox-btn').addEventListener('click', async () => {
  const facade = facadeFromSelection || facadePreview;
  if (!facade) {
    setResult('facade-coupling-result', {
      status: 400,
      body: { error: 'Beregn facade først.' }
    });
    return;
  }

  const wallDraftResponse = await postJson('/api/components/sandbox/create', {
    componentType: 'wall',
    areaM2: 10,
    variableLoadKn: 0
  });

  const roofDraftResponse = await postJson('/api/components/sandbox/create', {
    componentType: 'roof',
    areaM2: 10,
    variableLoadKn: 0
  });

  if (wallDraftResponse.status !== 200 || roofDraftResponse.status !== 200) {
    setResult('facade-coupling-result', {
      status: 400,
      body: { error: 'Kunne ikke oprette væg/tag drafts.' }
    });
    return;
  }

  const result = await postJson('/api/facade/couple-sandbox', {
    facade,
    wallDraft: wallDraftResponse.body.draft,
    roofDraft: roofDraftResponse.body.draft
  });

  setResult('facade-coupling-result', result);
});

function parseLineInput(input) {
  const pairs = String(input || '')
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(',').map((value) => Number(value.trim())));

  if (pairs.length < 2 || pairs.some((pair) => pair.length !== 2 || pair.some((value) => !Number.isFinite(value)))) {
    throw new Error('Linje-format skal være: x1,y1;x2,y2');
  }

  return pairs.map(([x, y]) => ({ x, y }));
}

function getLoadLinesPayload() {
  return {
    envelopeDepthM: Number(document.getElementById('load-lines-depth').value),
    lines: [
      {
        id: 'A',
        label: 'Linje A',
        points: parseLineInput(document.getElementById('load-line-a').value)
      },
      {
        id: 'B',
        label: 'Linje B',
        points: parseLineInput(document.getElementById('load-line-b').value)
      }
    ]
  };
}

document.getElementById('load-lines-project-btn').addEventListener('click', async () => {
  try {
    const payload = getLoadLinesPayload();
    const result = await postJson('/api/load-lines/project', payload);
    setResult('load-lines-project-result', result);
  } catch (error) {
    setResult('load-lines-project-result', { status: 400, body: { error: error.message } });
  }
});

document.getElementById('load-lines-conflicts-btn').addEventListener('click', async () => {
  try {
    const payload = getLoadLinesPayload();
    const result = await postJson('/api/load-lines/conflicts', { lines: payload.lines });
    setResult('load-lines-conflicts-result', result);
  } catch (error) {
    setResult('load-lines-conflicts-result', { status: 400, body: { error: error.message } });
  }
});

document.getElementById('load-lines-preview-btn').addEventListener('click', async () => {
  try {
    const payload = getLoadLinesPayload();
    const result = await postJson('/api/load-lines/preview', payload);
    setResult('load-lines-workflow-result', result);
  } catch (error) {
    setResult('load-lines-workflow-result', { status: 400, body: { error: error.message } });
  }
});

document.getElementById('engine-list-profiles-btn').addEventListener('click', async () => {
  const result = await getJson('/api/engine/profiles');
  setResult('engine-profiles-result', result);
});

document.getElementById('engine-calculate-btn').addEventListener('click', async () => {
  const payload = {
    components: [
      {
        id: 'ui-component-1',
        direction: document.getElementById('engine-direction').value,
        areaM2: Number(document.getElementById('engine-area').value),
        loadKnPerM2: Number(document.getElementById('engine-load-per-m2').value),
        tributaryWidthM: Number(document.getElementById('engine-tributary-width').value),
        influenceAreaM2: Number(document.getElementById('engine-influence-area').value),
        variableLoadKn: Number(document.getElementById('engine-variable-load').value)
      }
    ]
  };

  const result = await postJson('/api/engine/calculate', payload);
  setResult('engine-calc-result', result);
});

let latestIncidentId = null;

document.getElementById('ops-create-incident-btn').addEventListener('click', async () => {
  const payload = {
    title: document.getElementById('ops-incident-title').value,
    severity: document.getElementById('ops-incident-severity').value,
    service: 'api'
  };

  const result = await postJson('/api/ops/incidents', payload);
  if (result.status === 201) {
    latestIncidentId = result.body.incident.id;
  }
  setResult('ops-result', result);
});

document.getElementById('ops-close-incident-btn').addEventListener('click', async () => {
  if (!latestIncidentId) {
    setResult('ops-result', { status: 400, body: { error: 'Ingen incident at lukke endnu.' } });
    return;
  }

  const result = await postJson('/api/ops/incidents/close', {
    id: latestIncidentId,
    resolutionNote: 'Lukket fra UI'
  });

  setResult('ops-result', result);
});

document.getElementById('ops-summary-btn').addEventListener('click', async () => {
  const result = await postJson('/api/ops/summary', {
    checks: {
      security: true,
      tests: true,
      backups: true,
      monitoring: true,
      rollbackPlan: true
    }
  });

  setResult('ops-result', result);
});

document.getElementById('ops-drill-btn').addEventListener('click', async () => {
  const result = await postJson('/api/ops/drill-readiness', {
    backupRestoreOk: true,
    failoverOk: true,
    alertingOk: true
  });

  setResult('ops-result', result);
});

document.getElementById('release-create-btn').addEventListener('click', async () => {
  const engineReport = await postJson('/api/engine/calculate', {
    components: [
      {
        id: 'release-component',
        direction: 'z-',
        areaM2: Number(document.getElementById('engine-area').value || 20),
        loadKnPerM2: Number(document.getElementById('engine-load-per-m2').value || 1.2),
        tributaryWidthM: Number(document.getElementById('engine-tributary-width').value || 0.3),
        influenceAreaM2: Number(document.getElementById('engine-influence-area').value || 2),
        variableLoadKn: Number(document.getElementById('engine-variable-load').value || 3)
      }
    ]
  });

  if (engineReport.status !== 200) {
    setResult('release-result', engineReport);
    return;
  }

  const result = await postJson('/api/release/candidate', {
    version: document.getElementById('release-version').value,
    environment: document.getElementById('release-environment').value,
    calculationReport: engineReport.body.report
  });

  setResult('release-result', result);
});

document.getElementById('release-approve-btn').addEventListener('click', async () => {
  const result = await postJson('/api/release/approve', {
    technical: true,
    business: true
  });

  setResult('release-result', result);
});

document.getElementById('release-export-btn').addEventListener('click', async () => {
  const result = await postJson('/api/release/export', {
    audience: document.getElementById('release-audience').value
  });

  setResult('release-result', result);
});

document.getElementById('meta-status-btn').addEventListener('click', async () => {
  const result = await getJson('/api/meta/status');
  setResult('meta-status-result', result);
});

document.getElementById('meta-guide-btn').addEventListener('click', async () => {
  const result = await getJson('/api/meta/try-now');
  setResult('meta-guide-result', result);
});

document.getElementById('feedback-submit-btn').addEventListener('click', async () => {
  const payload = {
    title: document.getElementById('feedback-title').value,
    category: document.getElementById('feedback-category').value,
    severity: Number(document.getElementById('feedback-severity').value)
  };

  const result = await postJson('/api/feedback/submit', payload);
  setResult('feedback-result', result);
});

document.getElementById('feedback-priorities-btn').addEventListener('click', async () => {
  const result = await getJson('/api/feedback/priorities');
  setResult('feedback-result', result);
});

document.getElementById('feedback-kpis-btn').addEventListener('click', async () => {
  const result = await postJson('/api/feedback/kpis', {
    sessions: [
      { activated: true, completedFlow: true },
      { activated: true, completedFlow: false },
      { activated: false, completedFlow: false }
    ]
  });

  setResult('feedback-result', result);
});

let qualitySnapshots = [];

document.getElementById('quality-create-btn').addEventListener('click', async () => {
  const result = await postJson('/api/quality/snapshots', {
    name: document.getElementById('quality-snapshot-name').value,
    metrics: {
      testPassRate: Number(document.getElementById('quality-test-rate').value),
      lintPassRate: Number(document.getElementById('quality-lint-rate').value),
      securityPassRate: Number(document.getElementById('quality-security-rate').value),
      avgResponseMs: Number(document.getElementById('quality-response-ms').value)
    }
  });

  if (result.status === 201) {
    qualitySnapshots.push(result.body.snapshot);
    qualitySnapshots = qualitySnapshots.slice(-2);
  }
  setResult('quality-result', result);
});

document.getElementById('quality-compare-btn').addEventListener('click', async () => {
  if (qualitySnapshots.length < 2) {
    setResult('quality-result', { status: 400, body: { error: 'Opret mindst to snapshots først.' } });
    return;
  }

  const [base, candidate] = qualitySnapshots;
  const result = await postJson('/api/quality/compare', {
    baseId: base.id,
    candidateId: candidate.id
  });

  setResult('quality-result', result);
});

document.getElementById('pilot-trend-btn').addEventListener('click', async () => {
  const result = await postJson('/api/pilot/trends', {
    entries: [
      { day: 'D1', activationRate: 0.7, completionRate: 0.55, errorRate: 0.1 },
      { day: 'D2', activationRate: 0.65, completionRate: 0.5, errorRate: 0.15 }
    ]
  });

  setResult('quality-result', result);
});

document.getElementById('pilot-alert-btn').addEventListener('click', async () => {
  const result = await postJson('/api/pilot/alerts', {
    entries: [
      { day: 'D1', activationRate: 0.55, completionRate: 0.45, errorRate: 0.25 }
    ],
    thresholds: { activationMin: 0.6, completionMin: 0.5, errorMax: 0.2 }
  });

  setResult('quality-result', result);
});

let latestPhase16CaseId = null;

document.getElementById('phase16-create-btn').addEventListener('click', async () => {
  const result = await postJson('/api/phase16/reference-cases', {
    name: document.getElementById('phase16-case-name').value,
    category: document.getElementById('phase16-case-category').value,
    expectedResult: Number(document.getElementById('phase16-case-expected').value)
  });

  if (result.status === 201) {
    latestPhase16CaseId = result.body.referenceCase.id;
  }
  setResult('phase16-result', result);
});

document.getElementById('phase16-validate-btn').addEventListener('click', async () => {
  if (!latestPhase16CaseId) {
    setResult('phase16-result', { status: 400, body: { error: 'Opret case først.' } });
    return;
  }

  const result = await postJson('/api/phase16/reference-cases/validate', {
    referenceCaseId: latestPhase16CaseId,
    actualResult: Number(document.getElementById('phase16-case-actual').value)
  });

  setResult('phase16-result', result);
});

document.getElementById('phase17-review-btn').addEventListener('click', async () => {
  const result = await postJson('/api/phase17/gate-review', {
    gateId: document.getElementById('phase17-gate-id').value,
    checklist: {
      tests: document.getElementById('phase17-tests').checked,
      security: document.getElementById('phase17-security').checked,
      lint: document.getElementById('phase17-lint').checked,
      docs: document.getElementById('phase17-docs').checked
    }
  });

  setResult('phase17-result', result);
});

document.getElementById('phase18-plan-btn').addEventListener('click', async () => {
  const steps = document
    .getElementById('phase18-steps')
    .value.split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const result = await postJson('/api/phase18/rollout-plan', {
    version: document.getElementById('phase18-version').value,
    environment: document.getElementById('phase18-environment').value,
    steps
  });

  setResult('phase18-result', result);
});

document.getElementById('phase18-readiness-btn').addEventListener('click', async () => {
  const result = await postJson('/api/phase18/rollout-readiness', {
    checks: {
      backup: document.getElementById('phase18-backup').checked,
      rollback: document.getElementById('phase18-rollback').checked,
      monitoring: document.getElementById('phase18-monitoring').checked
    }
  });

  setResult('phase18-result', result);
});
