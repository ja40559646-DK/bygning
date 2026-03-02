import { buildRolloutPlan, evaluateRolloutReadiness } from '../../../packages/domain/src/phase18-rollout.js';
import { evaluateGateReview } from '../../../packages/domain/src/phase17-gate-review.js';
import { createReferenceCase, validateReferenceCase } from '../../../packages/domain/src/phase16-reference-cases.js';
import { buildPilotTrendSeries, detectPilotAlerts } from '../../../packages/domain/src/pilot-analytics.js';
import { compareQualitySnapshots, createQualitySnapshot } from '../../../packages/domain/src/quality-snapshots.js';
import { calculatePilotKpis, prioritizeFeedback, submitFeedback } from '../../../packages/domain/src/feedback-loop.js';
import { getPhaseStatus, getTryNowGuide } from '../../../packages/domain/src/demo-readiness.js';
import { listCombinationProfiles, runCalculationEngine } from '../../../packages/calculation-engine/src/engine.js';
import {
  closeIncident,
  createIncident,
  evaluateDrillReadiness,
  summarizeOperations
} from '../../../packages/domain/src/operations.js';
import {
  buildReleaseCandidate,
  exportReleaseReport,
  setReleaseApproval
} from '../../../packages/domain/src/release-governance.js';
import {
  detectLoadLineConflicts,
  previewLoadLineWorkflow,
  projectLoadLines
} from '../../../packages/domain/src/load-lines.js';
import {
  coupleFacadeWithSandbox,
  createMirroredGableProfile,
  estimateFacadeEnvelopeFromSelection,
  estimateFacadeSurfaces,
  selectParallelGableEdges
} from '../../../packages/domain/src/facade-workflow.js';
import {
  calculateDeadLoad,
  calculateLineLoad,
  calculatePointLoad,
  combineLoads,
  estimateComponentAssembly,
  calculateSandboxEstimate,
  createAssemblySandbox,
  getMaterialById,
  listBuildingComponents,
  listLoadCombinationTypes,
  listMaterials,
  suggestMaterialsForComponent,
  removeSandboxLayer,
  upsertSandboxLayer,
  listComponentPresets,
  applyPresetToSandbox,
  rollbackSandboxDraft,
  compareSandboxScenarios
} from '../../../packages/domain/src/material-catalog.js';

function parseJsonBody(rawBody) {
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}


function normalizeLoadPerM2(estimate) {
  const areaM2 = estimate?.draft?.areaM2;
  const permanentLoadKn = estimate?.permanentLoadKn;
  if (!Number.isFinite(areaM2) || areaM2 <= 0 || !Number.isFinite(permanentLoadKn) || permanentLoadKn <= 0) {
    throw new Error('Sandbox-estimat mangler gyldig areal/permanent last.');
  }

  return permanentLoadKn / areaM2;
}

function createLoadCalculationResponse(payload) {
  const material = getMaterialById(payload?.materialId);
  if (!material) {
    return { ok: false, status: 404, error: 'Ukendt materiale-id.' };
  }

  try {
    const deadLoad = calculateDeadLoad(material.id, payload.areaM2);
    const lineLoad = calculateLineLoad(material.id, payload.widthM);
    const pointLoad = calculatePointLoad(material.id, payload.influenceAreaM2);
    const combination = combineLoads({
      permanentLoadKn: deadLoad.deadLoadKn,
      variableLoadKn: payload.variableLoadKn ?? 0,
      combinationType: payload.combinationType || 'ulsPersistentTransient'
    });

    return {
      ok: true,
      status: 200,
      calculation: {
        material,
        deadLoad,
        lineLoad,
        pointLoad,
        combination
      }
    };
  } catch (error) {
    return { ok: false, status: 400, error: error.message };
  }
}

export function createApiHandlers({ projectService }) {
  const incidents = [];
  const feedbackItems = [];
  const qualitySnapshots = [];
  const referenceCases = [];
  let releaseCandidate = null;
  let rolloutPlan = null;

  return {
    handle(request) {
      const { method, path, body } = request;

      if (method === 'GET' && path === '/health') {
        return { status: 200, body: { status: 'ok' } };
      }


      if (method === 'GET' && path === '/api/meta/status') {
        return { status: 200, body: { status: getPhaseStatus() } };
      }

      if (method === 'GET' && path === '/api/meta/try-now') {
        return { status: 200, body: { guide: getTryNowGuide() } };
      }

      if (method === 'GET' && path === '/api/materials') {
        return { status: 200, body: { materials: listMaterials() } };
      }

      if (method === 'GET' && path === '/api/load-combinations') {
        return { status: 200, body: { combinations: listLoadCombinationTypes() } };
      }

      if (method === 'GET' && path === '/api/engine/profiles') {
        return { status: 200, body: { profiles: listCombinationProfiles() } };
      }

      if (method === 'GET' && path === '/api/components') {
        return { status: 200, body: { components: listBuildingComponents() } };
      }

      if (method === 'GET' && path.startsWith('/api/components/presets?')) {
        const query = new URLSearchParams(path.split('?')[1] || '');
        const componentType = query.get('componentType');

        try {
          const presets = listComponentPresets(componentType);
          return { status: 200, body: { presets } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'GET' && path.startsWith('/api/components/materials?')) {
        const query = new URLSearchParams(path.split('?')[1] || '');
        const componentType = query.get('componentType');

        try {
          const suggestion = suggestMaterialsForComponent(componentType);
          return { status: 200, body: { suggestion } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }



      if (method === 'POST' && path === '/api/components/sandbox/create') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const draft = createAssemblySandbox(parsed);
          return { status: 200, body: { draft } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/components/sandbox/upsert-layer') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const draft = upsertSandboxLayer(parsed.draft, parsed.layer);
          return { status: 200, body: { draft } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/components/sandbox/apply-preset') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const draft = applyPresetToSandbox(parsed.draft, parsed.presetId);
          return { status: 200, body: { draft } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/components/sandbox/remove-layer') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const draft = removeSandboxLayer(parsed.draft, parsed.layerId);
          return { status: 200, body: { draft } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/components/sandbox/rollback') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const draft = rollbackSandboxDraft(parsed.draft);
          return { status: 200, body: { draft } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }


      if (method === 'POST' && path === '/api/components/sandbox/compare') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const comparison = compareSandboxScenarios(parsed.leftDraft, parsed.rightDraft);
          return { status: 200, body: { comparison } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/components/sandbox/calculate') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const estimate = calculateSandboxEstimate(parsed.draft);
          return { status: 200, body: { estimate } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/components/estimate') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const estimate = estimateComponentAssembly(parsed);
          return { status: 200, body: { estimate } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }


      if (method === 'POST' && path === '/api/facade/preview') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const facade = estimateFacadeSurfaces(parsed);
          return { status: 200, body: { facade } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/facade/select-gable-direction') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const selection = selectParallelGableEdges(parsed);
          return { status: 200, body: { selection } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/facade/gable-profile') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const profile = createMirroredGableProfile(parsed);
          return { status: 200, body: { profile } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/facade/envelope-from-selection') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const facade = estimateFacadeEnvelopeFromSelection(parsed);
          return { status: 200, body: { facade } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/facade/couple-sandbox') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const wallEstimate = calculateSandboxEstimate(parsed.wallDraft);
          const roofEstimate = calculateSandboxEstimate(parsed.roofDraft);
          const coupling = coupleFacadeWithSandbox({
            facade: parsed.facade,
            wallLoadPerM2: normalizeLoadPerM2(wallEstimate),
            roofLoadPerM2: normalizeLoadPerM2(roofEstimate)
          });

          return { status: 200, body: { coupling, wallEstimate, roofEstimate } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }


      if (method === 'POST' && path === '/api/load-lines/project') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const projection = projectLoadLines(parsed);
          return { status: 200, body: { projection } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/load-lines/conflicts') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const validation = detectLoadLineConflicts(parsed.lines);
          return { status: 200, body: { validation } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/load-lines/preview') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const workflow = previewLoadLineWorkflow(parsed);
          return { status: 200, body: { workflow } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }


      if (method === 'POST' && path === '/api/engine/calculate') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const report = runCalculationEngine(parsed);
          return { status: 200, body: { report } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }


      if (method === 'POST' && path === '/api/ops/incidents') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const incident = createIncident(parsed);
          incidents.push(incident);
          return { status: 201, body: { incident } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/ops/incidents/close') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const index = incidents.findIndex((item) => item.id === parsed.id);
        if (index === -1) {
          return { status: 404, body: { error: 'Incident findes ikke.' } };
        }

        incidents[index] = closeIncident(incidents[index], parsed.resolutionNote);
        return { status: 200, body: { incident: incidents[index] } };
      }

      if (method === 'POST' && path === '/api/ops/summary') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const summary = summarizeOperations({ incidents, checks: parsed.checks || {} });
          return { status: 200, body: { summary } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/ops/drill-readiness') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const readiness = evaluateDrillReadiness(parsed);
          return { status: 200, body: { readiness } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/release/candidate') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          releaseCandidate = buildReleaseCandidate(parsed);
          return { status: 201, body: { candidate: releaseCandidate } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/release/approve') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        if (!releaseCandidate) {
          return { status: 400, body: { error: 'Opret release candidate først.' } };
        }

        releaseCandidate = setReleaseApproval(releaseCandidate, parsed);
        return { status: 200, body: { candidate: releaseCandidate } };
      }

      if (method === 'POST' && path === '/api/release/export') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        if (!releaseCandidate) {
          return { status: 400, body: { error: 'Opret release candidate først.' } };
        }

        try {
          const exported = exportReleaseReport(releaseCandidate, parsed.audience || 'internal');
          return { status: 200, body: { exported } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }


      if (method === 'POST' && path === '/api/feedback/submit') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const item = submitFeedback(parsed);
          feedbackItems.push(item);
          return { status: 201, body: { item } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'GET' && path === '/api/feedback/priorities') {
        try {
          const prioritized = prioritizeFeedback(feedbackItems);
          return { status: 200, body: { prioritized } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/feedback/kpis') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const kpis = calculatePilotKpis({
            sessions: parsed.sessions || [],
            feedbackItems
          });
          return { status: 200, body: { kpis } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }


      if (method === 'POST' && path === '/api/quality/snapshots') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const snapshot = createQualitySnapshot(parsed);
          qualitySnapshots.push(snapshot);
          return { status: 201, body: { snapshot } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/quality/compare') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const base = qualitySnapshots.find((item) => item.id === parsed.baseId);
          const candidate = qualitySnapshots.find((item) => item.id === parsed.candidateId);
          if (!base || !candidate) {
            return { status: 404, body: { error: 'Snapshots blev ikke fundet.' } };
          }
          const comparison = compareQualitySnapshots(base, candidate);
          return { status: 200, body: { comparison } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/pilot/trends') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const trend = buildPilotTrendSeries(parsed.entries || []);
        return { status: 200, body: { trend } };
      }

      if (method === 'POST' && path === '/api/pilot/alerts') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const analysis = detectPilotAlerts(parsed.entries || [], parsed.thresholds || {});
        return { status: 200, body: { analysis } };
      }


      if (method === 'POST' && path === '/api/phase16/reference-cases') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const referenceCase = createReferenceCase(parsed);
          referenceCases.push(referenceCase);
          return { status: 201, body: { referenceCase } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/phase16/reference-cases/validate') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const referenceCase = referenceCases.find((item) => item.id === parsed.referenceCaseId);
        if (!referenceCase) {
          return { status: 404, body: { error: 'Referencecase blev ikke fundet.' } };
        }

        try {
          const validation = validateReferenceCase(referenceCase, parsed.actualResult);
          return { status: 200, body: { validation } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/phase17/gate-review') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          const review = evaluateGateReview(parsed);
          return { status: 200, body: { review } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/phase18/rollout-plan') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        try {
          rolloutPlan = buildRolloutPlan(parsed);
          return { status: 201, body: { rolloutPlan } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/phase18/rollout-readiness') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        if (!rolloutPlan) {
          return { status: 400, body: { error: 'Opret rollout-plan først.' } };
        }

        try {
          const readiness = evaluateRolloutReadiness({ plan: rolloutPlan, checks: parsed.checks || {} });
          return { status: 200, body: { readiness } };
        } catch (error) {
          return { status: 400, body: { error: error.message } };
        }
      }

      if (method === 'POST' && path === '/api/materials/calculate-loads') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const result = createLoadCalculationResponse(parsed);
        return {
          status: result.status,
          body: result.ok ? { calculation: result.calculation } : { error: result.error }
        };
      }

      if (method === 'GET' && path === '/api/site-objects') {
        const result = projectService.listSiteObjects();
        return { status: result.status, body: { siteObjects: result.siteObjects } };
      }

      if (method === 'GET' && path === '/api/projects') {
        const result = projectService.listProjects();
        return { status: result.status, body: { projects: result.projects } };
      }

      if (method === 'POST' && path === '/api/intake') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const result = projectService.createIntake(parsed);
        return {
          status: result.status,
          body: result.ok ? { project: result.project } : { errors: result.errors }
        };
      }

      if (method === 'POST' && path === '/api/auth/request-code') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const result = projectService.requestOtp(parsed.email);
        return {
          status: result.status,
          body: result.ok ? { ok: true } : { error: result.error }
        };
      }

      if (method === 'POST' && path === '/api/site-objects') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const result = projectService.createSiteObject(parsed);
        return {
          status: result.status,
          body: result.ok ? { siteObject: result.siteObject } : { error: result.error }
        };
      }

      if (method === 'POST' && path === '/api/work-area/preview') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const result = projectService.previewWorkArea(parsed.name, parsed.points);
        return {
          status: result.status,
          body: result.ok ? { workArea: result.workArea } : { error: result.error }
        };
      }

      if (method === 'POST' && path === '/api/auth/verify') {
        const parsed = parseJsonBody(body);
        if (parsed === null) {
          return { status: 400, body: { error: 'Ugyldig JSON.' } };
        }

        const result = projectService.verifyOtp(parsed.email, parsed.code);
        return {
          status: result.status,
          body: result.ok ? { session: result.session } : { error: result.error }
        };
      }

      return { status: 404, body: { error: 'Endpoint findes ikke.' } };
    }
  };
}
