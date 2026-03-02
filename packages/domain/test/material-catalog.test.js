import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeadLoad,
  calculateLineLoad,
  calculatePointLoad,
  combineLoads,
  createAssemblySandbox,
  estimateComponentAssembly,
  getMaterialById,
  listBuildingComponents,
  listLoadCombinationTypes,
  listMaterials,
  calculateSandboxEstimate,
  removeSandboxLayer,
  suggestMaterialsForComponent,
  upsertSandboxLayer,
  listComponentPresets,
  applyPresetToSandbox,
  rollbackSandboxDraft,
  compareSandboxScenarios
} from '../src/material-catalog.js';

test('listMaterials contains 30 traditional elements', () => {
  assert.equal(listMaterials().length, 30);
});

test('getMaterialById returns known material with source references', () => {
  const material = getMaterialById('M009');
  assert.equal(material.name, 'Tagsten tegl');
  assert.equal(material.source.basis, 'EN 1991-1-1');
  assert.match(material.source.regulation, /BR18/);
});

test('traditional materials are loaded from database file shape', () => {
  const material = getMaterialById('M001');
  assert.equal(material.category, 'Ydervæg');
  assert.equal(typeof material.source.note, 'string');
});

test('listBuildingComponents exposes wall floor roof', () => {
  const components = listBuildingComponents();
  assert.equal(components.length, 3);
  assert.equal(components[0].id, 'wall');
});

test('suggestMaterialsForComponent filters materials by component category', () => {
  const suggestion = suggestMaterialsForComponent('roof');
  assert.equal(suggestion.category, 'Tag');
  assert.equal(suggestion.defaultMaterialId, 'M009');
  assert.ok(suggestion.materials.every((item) => item.category === 'Tag'));
});

test('estimateComponentAssembly returns component-level load result', () => {
  const estimate = estimateComponentAssembly({
    componentType: 'floor',
    areaM2: 20,
    materialId: 'M006',
    variableLoadKn: 2,
    combinationType: 'ulsPersistentTransient'
  });

  assert.equal(estimate.componentLabel, 'Gulv');
  assert.equal(estimate.deadLoad.deadLoadKn, 60);
  assert.equal(estimate.combination.combinedKn, 84);
});

test('createAssemblySandbox initializes isolated draft with default layer', () => {
  const draft = createAssemblySandbox({ componentType: 'wall', areaM2: 30, variableLoadKn: 2 });
  assert.equal(draft.componentType, 'wall');
  assert.equal(draft.layers.length, 1);
  assert.equal(draft.layers[0].materialId, 'M001');
});

test('upsertSandboxLayer can replace and add layers without side effects', () => {
  const baseDraft = createAssemblySandbox({ componentType: 'wall', areaM2: 30, variableLoadKn: 2 });
  const replacedDraft = upsertSandboxLayer(baseDraft, { layerId: 'base', materialId: 'M002', ratio: 1 });
  const extendedDraft = upsertSandboxLayer(replacedDraft, { layerId: 'inner', materialId: 'M004', ratio: 0.4 });

  assert.equal(baseDraft.layers[0].materialId, 'M001');
  assert.equal(replacedDraft.layers[0].materialId, 'M002');
  assert.equal(extendedDraft.layers.length, 2);
});

test('calculateSandboxEstimate returns combined load from draft layers', () => {
  const draft = createAssemblySandbox({ componentType: 'floor', areaM2: 20, variableLoadKn: 3 });
  const resizedBase = upsertSandboxLayer(draft, { layerId: 'base', materialId: 'M006', ratio: 0.5 });
  const updated = upsertSandboxLayer(resizedBase, { layerId: 'overlay', materialId: 'M008', ratio: 0.5 });
  const result = calculateSandboxEstimate(updated);

  assert.equal(result.layerLoads.length, 2);
  assert.ok(result.permanentLoadKn > 0);
  assert.ok(result.combination.combinedKn > result.permanentLoadKn);
});

test('removeSandboxLayer rejects removing all layers', () => {
  const draft = createAssemblySandbox({ componentType: 'roof', areaM2: 25, variableLoadKn: 1 });

  assert.throws(() => removeSandboxLayer(draft, 'base'), /mindst ét lag/);
});



test('listComponentPresets exposes templates for selected component', () => {
  const result = listComponentPresets('roof');
  assert.equal(result.componentType, 'roof');
  assert.ok(result.presets.length >= 1);
});

test('applyPresetToSandbox replaces layers from preset safely', () => {
  const draft = createAssemblySandbox({ componentType: 'roof', areaM2: 40, variableLoadKn: 2 });
  const updated = applyPresetToSandbox(draft, 'roof-tegl');

  assert.equal(draft.layers.length, 1);
  assert.equal(updated.layers.length, 2);
  assert.equal(updated.layers[0].layerId, 'cover');
});

test('rollbackSandboxDraft restores previous draft revision', () => {
  const draft = createAssemblySandbox({ componentType: 'wall', areaM2: 25, variableLoadKn: 2 });
  const changed = upsertSandboxLayer(draft, { layerId: 'base', materialId: 'M002', ratio: 0.6 });
  const withInner = upsertSandboxLayer(changed, { layerId: 'inner', materialId: 'M004', ratio: 0.4 });
  const rolledBack = rollbackSandboxDraft(withInner);

  assert.equal(withInner.layers.length, 2);
  assert.equal(rolledBack.layers.length, 1);
  assert.equal(rolledBack.layers[0].materialId, 'M002');
});

test('sandbox rejects layer ratios above total 1.0', () => {
  const draft = createAssemblySandbox({ componentType: 'wall', areaM2: 20, variableLoadKn: 2 });
  const withInner = upsertSandboxLayer(draft, { layerId: 'inner', materialId: 'M004', ratio: 0.5 });

  assert.throws(
    () => upsertSandboxLayer(withInner, { layerId: 'outer', materialId: 'M001', ratio: 0.8 }),
    /Summen af lag-andele/
  );
});




test('compareSandboxScenarios returns delta between two drafts', () => {
  const left = createAssemblySandbox({ componentType: 'roof', areaM2: 40, variableLoadKn: 2 });
  const rightBase = applyPresetToSandbox(left, 'roof-tegl');
  const right = upsertSandboxLayer(rightBase, { layerId: 'cover', materialId: 'M010', ratio: 0.7 });

  const comparison = compareSandboxScenarios(left, right);
  assert.ok(Number.isFinite(comparison.delta.permanentLoadKn));
  assert.ok(Number.isFinite(comparison.delta.combinedKn));
});


test('calculateDeadLoad computes kN from area', () => {
  const load = calculateDeadLoad('M001', 20);
  assert.equal(load.deadLoadKn, 36);
  assert.equal(load.source.nationalAnnex, 'DK NA til EN 1991-1-1');
});

test('calculateLineLoad computes kN/m from strip width', () => {
  const load = calculateLineLoad('M006', 0.3);
  assert.ok(Math.abs(load.lineLoadKnPerM - 0.9) < 1e-9);
});

test('calculatePointLoad computes kN from influence area', () => {
  const load = calculatePointLoad('M010', 2.5);
  assert.equal(load.pointLoadKn, 2);
});

test('listLoadCombinationTypes returns ULS and SLS options', () => {
  const combinations = listLoadCombinationTypes();
  assert.equal(combinations.length, 2);
  assert.equal(combinations[0].id, 'ulsPersistentTransient');
});

test('combineLoads applies ULS factors for permanent and variable load', () => {
  const result = combineLoads({
    permanentLoadKn: 10,
    variableLoadKn: 2,
    combinationType: 'ulsPersistentTransient'
  });

  assert.equal(result.combinedKn, 16.5);
});

test('combineLoads rejects invalid combination type', () => {
  assert.throws(
    () => combineLoads({ permanentLoadKn: 10, variableLoadKn: 2, combinationType: 'invalid' }),
    /Ukendt kombinationstype/
  );
});
