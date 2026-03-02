import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiHandlers } from '../src/handlers.js';
import { createProjectService } from '../../../packages/domain/src/project-service.js';
import { createInMemoryProjectRepository } from '../../../packages/domain/src/project-repository.js';
import { createInMemoryOtpRepository } from '../../../packages/domain/src/otp-repository.js';
import { createInMemoryMailer } from '../../../packages/domain/src/mailer.js';
import { createInMemorySiteObjectRepository } from '../../../packages/domain/src/site-object-repository.js';

function setup() {
  const mailer = createInMemoryMailer();
  const service = createProjectService({
    projectRepository: createInMemoryProjectRepository(),
    otpRepository: createInMemoryOtpRepository(),
    mailer,
    siteObjectRepository: createInMemorySiteObjectRepository()
  });

  return {
    handlers: createApiHandlers({ projectService: service }),
    mailer
  };
}

const validPayload = {
  customerName: 'Byg Kunde',
  customerAddress: {
    street: 'Skovvej',
    number: '10',
    postalCode: '9000',
    city: 'Aalborg',
    phone: '+45 11223344',
    email: 'kunde@example.dk'
  },
  projectName: 'Ny tilbygning',
  projectAddressSameAsCustomer: true
};

test('health endpoint returns ok', () => {
  const { handlers } = setup();
  const response = handlers.handle({ method: 'GET', path: '/health' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});



test('components endpoint lists wall floor roof', () => {
  const { handlers } = setup();

  const response = handlers.handle({ method: 'GET', path: '/api/components' });

  assert.equal(response.status, 200);
  assert.equal(response.body.components.length, 3);
  assert.equal(response.body.components[0].id, 'wall');
});

test('component material suggestion returns category-specific list', () => {
  const { handlers } = setup();

  const response = handlers.handle({ method: 'GET', path: '/api/components/materials?componentType=roof' });

  assert.equal(response.status, 200);
  assert.equal(response.body.suggestion.componentType, 'roof');
  assert.ok(response.body.suggestion.materials.every((item) => item.category === 'Tag'));
});

test('component estimate endpoint returns component load estimate', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/components/estimate',
    body: JSON.stringify({
      componentType: 'floor',
      areaM2: 20,
      materialId: 'M006',
      variableLoadKn: 2,
      combinationType: 'ulsPersistentTransient'
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.estimate.componentLabel, 'Gulv');
  assert.equal(response.body.estimate.deadLoad.deadLoadKn, 60);
});






test('component presets endpoint returns options for component type', () => {
  const { handlers } = setup();

  const response = handlers.handle({ method: 'GET', path: '/api/components/presets?componentType=roof' });

  assert.equal(response.status, 200);
  assert.equal(response.body.presets.componentType, 'roof');
  assert.ok(response.body.presets.presets.length >= 1);
});

test('sandbox apply preset endpoint replaces draft layers', () => {
  const { handlers } = setup();

  const createResponse = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/create',
    body: JSON.stringify({ componentType: 'roof', areaM2: 40, variableLoadKn: 2 })
  });

  const response = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/apply-preset',
    body: JSON.stringify({ draft: createResponse.body.draft, presetId: 'roof-tegl' })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.draft.layers.length, 2);
});

test('sandbox rollback endpoint restores previous revision', () => {
  const { handlers } = setup();

  const createResponse = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/create',
    body: JSON.stringify({ componentType: 'wall', areaM2: 30, variableLoadKn: 2 })
  });

  const upsertResponse = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/upsert-layer',
    body: JSON.stringify({
      draft: createResponse.body.draft,
      layer: { layerId: 'base', materialId: 'M002', ratio: 1 }
    })
  });

  const rollbackResponse = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/rollback',
    body: JSON.stringify({ draft: upsertResponse.body.draft })
  });

  assert.equal(rollbackResponse.status, 200);
  assert.equal(rollbackResponse.body.draft.layers[0].materialId, 'M001');
});


test('sandbox create/upsert/calculate flow works without mutating base draft', () => {
  const { handlers } = setup();

  const createResponse = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/create',
    body: JSON.stringify({ componentType: 'wall', areaM2: 30, variableLoadKn: 2 })
  });

  assert.equal(createResponse.status, 200);

  const baseDraft = createResponse.body.draft;
  const resizeBaseResponse = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/upsert-layer',
    body: JSON.stringify({
      draft: baseDraft,
      layer: { layerId: 'base', materialId: 'M001', ratio: 0.5 }
    })
  });

  const upsertResponse = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/upsert-layer',
    body: JSON.stringify({
      draft: resizeBaseResponse.body.draft,
      layer: { layerId: 'inner', materialId: 'M004', ratio: 0.5 }
    })
  });

  assert.equal(upsertResponse.status, 200);
  assert.equal(baseDraft.layers.length, 1);
  assert.equal(upsertResponse.body.draft.layers.length, 2);

  const calcResponse = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/calculate',
    body: JSON.stringify({ draft: upsertResponse.body.draft })
  });

  assert.equal(calcResponse.status, 200);
  assert.equal(calcResponse.body.estimate.layerLoads.length, 2);
});




test('sandbox compare endpoint returns load deltas between drafts', () => {
  const { handlers } = setup();

  const leftCreate = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/create',
    body: JSON.stringify({ componentType: 'roof', areaM2: 40, variableLoadKn: 2 })
  });

  const rightCreate = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/create',
    body: JSON.stringify({ componentType: 'roof', areaM2: 40, variableLoadKn: 2 })
  });

  const rightPreset = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/apply-preset',
    body: JSON.stringify({ draft: rightCreate.body.draft, presetId: 'roof-tegl' })
  });

  const response = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/compare',
    body: JSON.stringify({
      leftDraft: leftCreate.body.draft,
      rightDraft: rightPreset.body.draft
    })
  });

  assert.equal(response.status, 200);
  assert.ok(Number.isFinite(response.body.comparison.delta.combinedKn));
});




test('facade preview endpoint returns facade envelope areas', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/facade/preview',
    body: JSON.stringify({
      buildingLengthM: 12,
      buildingWidthM: 8,
      wallHeightM: 2.8,
      gableHeightM: 1.6
    })
  });

  assert.equal(response.status, 200);
  assert.ok(Math.abs(response.body.facade.areas.totalFacadeEnvelopeM2 - 124.8) < 1e-9);
});



test('facade select-gable-direction endpoint validates parallel edges', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/facade/select-gable-direction',
    body: JSON.stringify({
      points: [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 8 },
        { x: 0, y: 8 }
      ],
      firstEdgeIndex: 0,
      secondEdgeIndex: 2
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.selection.orientation.spanM, 8);
});

test('facade gable-profile endpoint mirrors profile from ridge height', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/facade/gable-profile',
    body: JSON.stringify({ spanM: 8, wallHeightM: 2.8, ridgeHeightM: 4.4 })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.profile.points[1].x, 4);
});

test('facade envelope-from-selection endpoint derives geometry from polygon selection', () => {
  const { handlers } = setup();

  const selectionResponse = handlers.handle({
    method: 'POST',
    path: '/api/facade/select-gable-direction',
    body: JSON.stringify({
      points: [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 8 },
        { x: 0, y: 8 }
      ],
      firstEdgeIndex: 0,
      secondEdgeIndex: 2
    })
  });

  const response = handlers.handle({
    method: 'POST',
    path: '/api/facade/envelope-from-selection',
    body: JSON.stringify({
      points: [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 8 },
        { x: 0, y: 8 }
      ],
      gableSelection: selectionResponse.body.selection,
      wallHeightM: 2.8,
      ridgeHeightM: 4.4
    })
  });

  assert.equal(response.status, 200);
  assert.ok(Math.abs(response.body.facade.areas.totalFacadeEnvelopeM2 - 124.8) < 1e-9);
});

test('facade couple-sandbox endpoint combines facade surfaces with wall/roof drafts', () => {
  const { handlers } = setup();

  const facadeResponse = handlers.handle({
    method: 'POST',
    path: '/api/facade/preview',
    body: JSON.stringify({
      buildingLengthM: 12,
      buildingWidthM: 8,
      wallHeightM: 2.8,
      gableHeightM: 1.6
    })
  });

  const wallDraft = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/create',
    body: JSON.stringify({ componentType: 'wall', areaM2: 10, variableLoadKn: 0 })
  }).body.draft;

  const roofDraft = handlers.handle({
    method: 'POST',
    path: '/api/components/sandbox/create',
    body: JSON.stringify({ componentType: 'roof', areaM2: 10, variableLoadKn: 0 })
  }).body.draft;

  const response = handlers.handle({
    method: 'POST',
    path: '/api/facade/couple-sandbox',
    body: JSON.stringify({
      facade: facadeResponse.body.facade,
      wallDraft,
      roofDraft
    })
  });

  assert.equal(response.status, 200);
  assert.ok(response.body.coupling.totalEnvelopeLoadKn > 0);
});



test('load-lines project endpoint returns front/back projection', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/load-lines/project',
    body: JSON.stringify({
      envelopeDepthM: 8,
      lines: [
        { id: 'L1', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] }
      ]
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.projection.projected[0].back[0].z, 8);
});

test('load-lines conflicts endpoint finds crossing lines', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/load-lines/conflicts',
    body: JSON.stringify({
      lines: [
        { id: 'L1', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
        { id: 'L2', points: [{ x: 0, y: 10 }, { x: 10, y: 0 }] }
      ]
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.validation.isValid, false);
});

test('load-lines preview endpoint returns deterministic workflow', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/load-lines/preview',
    body: JSON.stringify({
      envelopeDepthM: 10,
      lines: [
        { id: 'L2', points: [{ x: 0, y: 3 }, { x: 10, y: 3 }] },
        { id: 'L1', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] }
      ]
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.workflow.projection.projected[0].lineId, 'L1');
  assert.equal(response.body.workflow.validation.isValid, true);
});


test('engine profiles endpoint returns calculation profile list', () => {
  const { handlers } = setup();

  const response = handlers.handle({ method: 'GET', path: '/api/engine/profiles' });

  assert.equal(response.status, 200);
  assert.equal(response.body.profiles[0].id, 'dkNaBasic');
});

test('engine calculate endpoint returns area/line/point report with combinations', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/engine/calculate',
    body: JSON.stringify({
      components: [
        {
          id: 'roof-1',
          direction: 'z-',
          areaM2: 20,
          loadKnPerM2: 1.2,
          tributaryWidthM: 0.3,
          influenceAreaM2: 2,
          variableLoadKn: 3
        }
      ]
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.report.componentResults[0].results.areaLoadKn, 24);
  assert.ok(response.body.report.combinations['z-'].ulsKn > response.body.report.combinations['z-'].slsKn);
});


test('ops incident lifecycle + summary endpoint works', () => {
  const { handlers } = setup();

  const created = handlers.handle({
    method: 'POST',
    path: '/api/ops/incidents',
    body: JSON.stringify({ title: 'API latency', severity: 'high', service: 'api' })
  });

  assert.equal(created.status, 201);

  const closed = handlers.handle({
    method: 'POST',
    path: '/api/ops/incidents/close',
    body: JSON.stringify({ id: created.body.incident.id, resolutionNote: 'Scaled workers' })
  });

  assert.equal(closed.status, 200);
  assert.equal(closed.body.incident.status, 'closed');

  const summary = handlers.handle({
    method: 'POST',
    path: '/api/ops/summary',
    body: JSON.stringify({ checks: { security: true, tests: true, backups: true, monitoring: true, rollbackPlan: true } })
  });

  assert.equal(summary.status, 200);
  assert.equal(summary.body.summary.goLiveReady, true);
});

test('ops drill readiness endpoint returns score', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/ops/drill-readiness',
    body: JSON.stringify({ backupRestoreOk: true, failoverOk: true, alertingOk: false })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.readiness.score, 2);
});

test('release candidate + approve + export endpoints support internal/customer views', () => {
  const { handlers } = setup();

  const report = handlers.handle({
    method: 'POST',
    path: '/api/engine/calculate',
    body: JSON.stringify({
      components: [
        {
          id: 'c1',
          direction: 'z-',
          areaM2: 20,
          loadKnPerM2: 1.2,
          tributaryWidthM: 0.3,
          influenceAreaM2: 2,
          variableLoadKn: 1
        }
      ]
    })
  });

  const created = handlers.handle({
    method: 'POST',
    path: '/api/release/candidate',
    body: JSON.stringify({ version: '1.0.0', environment: 'staging', calculationReport: report.body.report })
  });
  assert.equal(created.status, 201);

  const approved = handlers.handle({
    method: 'POST',
    path: '/api/release/approve',
    body: JSON.stringify({ technical: true, business: true })
  });
  assert.equal(approved.body.candidate.approvals.technical, true);

  const customerExport = handlers.handle({
    method: 'POST',
    path: '/api/release/export',
    body: JSON.stringify({ audience: 'customer' })
  });

  assert.equal(customerExport.status, 200);
  assert.ok(customerExport.body.exported.summary);
});


test('meta status endpoint exposes completion through phase 10', () => {
  const { handlers } = setup();
  const response = handlers.handle({ method: 'GET', path: '/api/meta/status' });

  assert.equal(response.status, 200);
  const phase10 = response.body.status.phases.find((item) => item.phase === 10);
  assert.equal(phase10.status, 'completed');
});

test('meta try-now endpoint returns local run guide', () => {
  const { handlers } = setup();
  const response = handlers.handle({ method: 'GET', path: '/api/meta/try-now' });

  assert.equal(response.status, 200);
  assert.equal(response.body.guide.entrypoint, 'http://localhost:3000');
});


test('feedback submit/priorities/kpis endpoints provide pilot loop', () => {
  const { handlers } = setup();

  const created = handlers.handle({
    method: 'POST',
    path: '/api/feedback/submit',
    body: JSON.stringify({ title: 'Forkert beregning vist', category: 'error', severity: 4 })
  });
  assert.equal(created.status, 201);

  const priorities = handlers.handle({ method: 'GET', path: '/api/feedback/priorities' });
  assert.equal(priorities.status, 200);
  assert.equal(priorities.body.prioritized.top.category, 'error');

  const kpis = handlers.handle({
    method: 'POST',
    path: '/api/feedback/kpis',
    body: JSON.stringify({ sessions: [{ activated: true, completedFlow: true }, { activated: false, completedFlow: false }] })
  });

  assert.equal(kpis.status, 200);
  assert.ok(kpis.body.kpis.activationRate > 0);
});


test('quality snapshots create/compare endpoints detect regression', () => {
  const { handlers } = setup();

  const base = handlers.handle({
    method: 'POST',
    path: '/api/quality/snapshots',
    body: JSON.stringify({ name: 'base', metrics: { testPassRate: 1, lintPassRate: 1, securityPassRate: 1, avgResponseMs: 100 } })
  });
  const candidate = handlers.handle({
    method: 'POST',
    path: '/api/quality/snapshots',
    body: JSON.stringify({ name: 'candidate', metrics: { testPassRate: 1, lintPassRate: 1, securityPassRate: 1, avgResponseMs: 130 } })
  });

  const compare = handlers.handle({
    method: 'POST',
    path: '/api/quality/compare',
    body: JSON.stringify({ baseId: base.body.snapshot.id, candidateId: candidate.body.snapshot.id })
  });

  assert.equal(compare.status, 200);
  assert.equal(compare.body.comparison.regressionRisk, true);
});

test('pilot trends/alerts endpoints return trend and alerts', () => {
  const { handlers } = setup();

  const trend = handlers.handle({
    method: 'POST',
    path: '/api/pilot/trends',
    body: JSON.stringify({ entries: [{ day: 'D1', activationRate: 0.5, completionRate: 0.4, errorRate: 0.3 }] })
  });
  assert.equal(trend.status, 200);

  const alerts = handlers.handle({
    method: 'POST',
    path: '/api/pilot/alerts',
    body: JSON.stringify({ entries: [{ day: 'D1', activationRate: 0.5, completionRate: 0.4, errorRate: 0.3 }] })
  });
  assert.equal(alerts.status, 200);
  assert.equal(alerts.body.analysis.hasAlerts, true);
});


test('phase16 reference case create/validate endpoints work', () => {
  const { handlers } = setup();

  const created = handlers.handle({
    method: 'POST',
    path: '/api/phase16/reference-cases',
    body: JSON.stringify({ name: 'Tag case', category: 'roof', expectedResult: 12.5 })
  });
  assert.equal(created.status, 201);

  const validated = handlers.handle({
    method: 'POST',
    path: '/api/phase16/reference-cases/validate',
    body: JSON.stringify({ referenceCaseId: created.body.referenceCase.id, actualResult: 12.5 })
  });

  assert.equal(validated.status, 200);
  assert.equal(validated.body.validation.passed, true);
});

test('phase17 gate-review endpoint returns decision', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/phase17/gate-review',
    body: JSON.stringify({ gateId: 'G9', checklist: { tests: true, security: true, lint: true, docs: false } })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.review.decision, 'blocked');
});

test('phase18 rollout endpoints create plan and readiness', () => {
  const { handlers } = setup();

  const created = handlers.handle({
    method: 'POST',
    path: '/api/phase18/rollout-plan',
    body: JSON.stringify({ version: '2.0.0', environment: 'staging', steps: ['Backup', 'Deploy', 'Verify'] })
  });
  assert.equal(created.status, 201);

  const readiness = handlers.handle({
    method: 'POST',
    path: '/api/phase18/rollout-readiness',
    body: JSON.stringify({ checks: { backup: true, rollback: true, monitoring: true } })
  });

  assert.equal(readiness.status, 200);
  assert.equal(readiness.body.readiness.recommendedAction, 'deploy');
});

test('materials endpoint lists traditional catalog', () => {
  const { handlers } = setup();

  const response = handlers.handle({ method: 'GET', path: '/api/materials' });

  assert.equal(response.status, 200);
  assert.equal(response.body.materials.length, 30);
  assert.equal(response.body.materials[0].id, 'M001');
});

test('load combinations endpoint lists ULS/SLS', () => {
  const { handlers } = setup();

  const response = handlers.handle({ method: 'GET', path: '/api/load-combinations' });

  assert.equal(response.status, 200);
  assert.equal(response.body.combinations.length, 2);
  assert.equal(response.body.combinations[0].id, 'ulsPersistentTransient');
});

test('load calculation endpoint returns load bundle', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/materials/calculate-loads',
    body: JSON.stringify({
      materialId: 'M006',
      areaM2: 20,
      widthM: 0.3,
      influenceAreaM2: 2,
      variableLoadKn: 2,
      combinationType: 'ulsPersistentTransient'
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.calculation.deadLoad.deadLoadKn, 60);
  assert.ok(Math.abs(response.body.calculation.lineLoad.lineLoadKnPerM - 0.9) < 1e-9);
  assert.equal(response.body.calculation.pointLoad.pointLoadKn, 6);
});

test('intake endpoint creates project', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/intake',
    body: JSON.stringify(validPayload)
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.project.projectName, 'Ny tilbygning');
});

test('request-code endpoint triggers email', () => {
  const { handlers, mailer } = setup();

  handlers.handle({
    method: 'POST',
    path: '/api/intake',
    body: JSON.stringify(validPayload)
  });

  const response = handlers.handle({
    method: 'POST',
    path: '/api/auth/request-code',
    body: JSON.stringify({ email: 'kunde@example.dk' })
  });

  assert.equal(response.status, 200);
  assert.equal(mailer.getSent().length, 1);
});

test('verify endpoint returns session after request-code', () => {
  const { handlers, mailer } = setup();

  handlers.handle({
    method: 'POST',
    path: '/api/intake',
    body: JSON.stringify(validPayload)
  });

  handlers.handle({
    method: 'POST',
    path: '/api/auth/request-code',
    body: JSON.stringify({ email: 'kunde@example.dk' })
  });

  const code = mailer.getSent()[0].text.match(/[A-Z0-9]{6}/)[0];
  const response = handlers.handle({
    method: 'POST',
    path: '/api/auth/verify',
    body: JSON.stringify({ email: 'kunde@example.dk', code })
  });

  assert.equal(response.status, 200);
  assert.match(response.body.session.token, /^SESS-/);
});

test('projects endpoint returns created projects', () => {
  const { handlers } = setup();

  handlers.handle({
    method: 'POST',
    path: '/api/intake',
    body: JSON.stringify(validPayload)
  });

  const response = handlers.handle({ method: 'GET', path: '/api/projects' });

  assert.equal(response.status, 200);
  assert.equal(response.body.projects.length, 1);
  assert.equal(response.body.projects[0].projectName, 'Ny tilbygning');
});

test('work-area preview endpoint returns area', () => {
  const { handlers } = setup();

  const response = handlers.handle({
    method: 'POST',
    path: '/api/work-area/preview',
    body: JSON.stringify({
      name: 'Testområde',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 5 },
        { x: 0, y: 5 }
      ]
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.workArea.areaM2, 50);
});

test('site-objects endpoint creates and lists objects', () => {
  const { handlers } = setup();

  const createResponse = handlers.handle({
    method: 'POST',
    path: '/api/site-objects',
    body: JSON.stringify({
      type: 'hus',
      name: 'Hovedhus',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 5 },
        { x: 0, y: 5 }
      ]
    })
  });

  assert.equal(createResponse.status, 201);

  const listResponse = handlers.handle({ method: 'GET', path: '/api/site-objects' });
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.siteObjects.length, 1);
  assert.equal(listResponse.body.siteObjects[0].type, 'hus');
});
