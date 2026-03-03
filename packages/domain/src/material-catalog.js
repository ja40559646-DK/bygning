import { readFileSync } from 'node:fs';

const LOAD_COMBINATION_FACTORS = {
  ulsPersistentTransient: {
    name: 'ULS persistent/transient',
    gammaG: 1.35,
    gammaQLeading: 1.5,
    psi0Leading: 1.0
  },
  slsCharacteristic: {
    name: 'SLS characteristic',
    gammaG: 1.0,
    gammaQLeading: 1.0,
    psi0Leading: 1.0
  }
};

const COMPONENT_CATALOG = {
  wall: {
    label: 'Væg',
    category: 'Ydervæg',
    defaultMaterialId: 'M001',
    measureLabel: 'Areal m²'
  },
  floor: {
    label: 'Gulv',
    category: 'Gulv',
    defaultMaterialId: 'M006',
    measureLabel: 'Areal m²'
  },
  roof: {
    label: 'Tag',
    category: 'Tag',
    defaultMaterialId: 'M009',
    measureLabel: 'Areal m²'
  }
};

const MAX_LAYER_RATIO = 1;


const COMPONENT_PRESETS = {
  wall: [
    {
      id: 'wall-standard-tegl',
      label: 'Standard ydervæg (tegl + gips)',
      layers: [
        { layerId: 'outer', materialId: 'M001', ratio: 0.7 },
        { layerId: 'inner', materialId: 'M004', ratio: 0.3 }
      ]
    },
    {
      id: 'wall-lightweight',
      label: 'Let ydervæg (træskelet + gips)',
      layers: [
        { layerId: 'outer', materialId: 'M003', ratio: 0.65 },
        { layerId: 'inner', materialId: 'M004', ratio: 0.35 }
      ]
    }
  ],
  floor: [
    {
      id: 'floor-concrete',
      label: 'Betondæk + trægulv',
      layers: [
        { layerId: 'base', materialId: 'M006', ratio: 0.85 },
        { layerId: 'finish', materialId: 'M008', ratio: 0.15 }
      ]
    }
  ],
  roof: [
    {
      id: 'roof-tegl',
      label: 'Teglsten + spærtræ',
      layers: [
        { layerId: 'cover', materialId: 'M009', ratio: 0.7 },
        { layerId: 'structure', materialId: 'M013', ratio: 0.3 }
      ]
    },
    {
      id: 'roof-steel-light',
      label: 'Ståltag let + spærtræ',
      layers: [
        { layerId: 'cover', materialId: 'M011', ratio: 0.45 },
        { layerId: 'structure', materialId: 'M013', ratio: 0.55 }
      ]
    }
  ]
};

function loadTraditionalMaterials() {
  const dataUrl = new URL('../data/materials.traditional.json', import.meta.url);
  const raw = readFileSync(dataUrl, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Materialedatabase er tom eller ugyldig.');
  }

  for (const item of parsed) {
    if (!item.id || !item.name || !item.category || !Number.isFinite(item.densityKnM2) || !item.source) {
      throw new Error('Materialedatabase indeholder ugyldige felter.');
    }
  }

  return parsed;
}

const MATERIALS = loadTraditionalMaterials();

function toPublicMaterial(material) {
  return {
    ...material,
    source: {
      ...material.source
    }
  };
}

function assertPositiveFiniteNumber(value, fieldName) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} skal være et positivt tal.`);
  }
}

function getCombinationFactors(combinationType) {
  const factors = LOAD_COMBINATION_FACTORS[combinationType];
  if (!factors) {
    throw new Error('Ukendt kombinationstype.');
  }

  return factors;
}

function getComponentDefinition(componentType) {
  const component = COMPONENT_CATALOG[componentType];
  if (!component) {
    throw new Error('Ukendt bygningskomponent.');
  }

  return component;
}

function cloneDraft(draft) {
  return {
    ...draft,
    layers: draft.layers.map((layer) => ({ ...layer }))
  };
}

function assertLayerRatio(value) {
  if (!Number.isFinite(value) || value <= 0 || value > MAX_LAYER_RATIO) {
    throw new Error('Lag-andel skal være et tal mellem 0 og 1.');
  }
}

function assertDraftShape(draft) {
  if (!draft || !draft.componentType || !Array.isArray(draft.layers)) {
    throw new Error('Draft er ugyldig.');
  }

  getComponentDefinition(draft.componentType);
  assertPositiveFiniteNumber(draft.areaM2, 'Areal');

  let ratioSum = 0;
  for (const layer of draft.layers) {
    if (!layer.layerId || !layer.materialId) {
      throw new Error('Draft-lag mangler felter.');
    }

    assertLayerRatio(layer.ratio);
    ratioSum += layer.ratio;

    if (!getMaterialById(layer.materialId)) {
      throw new Error('Draft refererer til ukendt materiale-id.');
    }
  }

  if (ratioSum > MAX_LAYER_RATIO + 1e-9) {
    throw new Error('Summen af lag-andele må ikke overstige 1.');
  }
}

function buildLayerLoadEntry(draft, layer) {
  const layerAreaM2 = draft.areaM2 * layer.ratio;
  const deadLoad = calculateDeadLoad(layer.materialId, layerAreaM2);

  return {
    layerId: layer.layerId,
    material: getMaterialById(layer.materialId),
    ratio: layer.ratio,
    layerAreaM2,
    deadLoadKn: deadLoad.deadLoadKn
  };
}

function getRatioSummary(draft) {
  const ratioUsed = draft.layers.reduce((sum, layer) => sum + layer.ratio, 0);
  const ratioRemaining = Math.max(0, 1 - ratioUsed);

  return {
    ratioUsed,
    ratioRemaining,
    isComplete: ratioRemaining <= 1e-9
  };
}

function withHistorySnapshot(nextDraft, previousDraft) {
  const previousState = {
    componentType: previousDraft.componentType,
    componentLabel: previousDraft.componentLabel,
    category: previousDraft.category,
    areaM2: previousDraft.areaM2,
    variableLoadKn: previousDraft.variableLoadKn,
    combinationType: previousDraft.combinationType,
    layers: previousDraft.layers.map((layer) => ({ ...layer }))
  };

  const history = Array.isArray(previousDraft.history) ? [...previousDraft.history, previousState] : [previousState];

  return {
    ...nextDraft,
    history: history.slice(-20)
  };
}

export function listMaterials() {
  return MATERIALS.map(toPublicMaterial);
}

export function getMaterialById(id) {
  const material = MATERIALS.find((item) => item.id === id);
  return material ? toPublicMaterial(material) : null;
}

export function listLoadCombinationTypes() {
  return Object.entries(LOAD_COMBINATION_FACTORS).map(([id, factors]) => ({
    id,
    ...factors
  }));
}

export function listBuildingComponents() {
  return Object.entries(COMPONENT_CATALOG).map(([id, component]) => {
    const materials = MATERIALS
      .filter((item) => item.category === component.category)
      .map((item) => ({ id: item.id, name: item.name, densityKnM2: item.densityKnM2 }));

    return {
      id,
      ...component,
      materials
    };
  });
}

export function suggestMaterialsForComponent(componentType) {
  const component = getComponentDefinition(componentType);

  const materials = MATERIALS
    .filter((item) => item.category === component.category)
    .map((item) => toPublicMaterial(item));

  return {
    componentType,
    componentLabel: component.label,
    category: component.category,
    defaultMaterialId: component.defaultMaterialId,
    materials
  };
}

export function listComponentPresets(componentType) {
  const component = getComponentDefinition(componentType);
  const presets = COMPONENT_PRESETS[componentType] || [];

  return {
    componentType,
    componentLabel: component.label,
    presets: presets.map((preset) => ({
      id: preset.id,
      label: preset.label,
      layers: preset.layers.map((layer) => ({ ...layer }))
    }))
  };
}

export function applyPresetToSandbox(draft, presetId) {
  assertDraftShape(draft);

  const presets = COMPONENT_PRESETS[draft.componentType] || [];
  const preset = presets.find((item) => item.id === presetId);
  if (!preset) {
    throw new Error('Ukendt preset for komponent.');
  }

  const nextDraft = cloneDraft(draft);
  nextDraft.layers = preset.layers.map((layer) => ({ ...layer }));
  assertDraftShape(nextDraft);

  const withHistory = withHistorySnapshot(nextDraft, draft);
  return {
    ...withHistory,
    ratioSummary: getRatioSummary(withHistory)
  };
}

export function estimateComponentAssembly({ componentType, areaM2, materialId, variableLoadKn = 0, combinationType }) {
  const component = getComponentDefinition(componentType);
  const selectedMaterialId = materialId || component.defaultMaterialId;

  const deadLoad = calculateDeadLoad(selectedMaterialId, areaM2);
  const combination = combineLoads({
    permanentLoadKn: deadLoad.deadLoadKn,
    variableLoadKn,
    combinationType: combinationType || 'ulsPersistentTransient'
  });

  return {
    componentType,
    componentLabel: component.label,
    category: component.category,
    material: getMaterialById(selectedMaterialId),
    areaM2,
    deadLoad,
    combination
  };
}

export function createAssemblySandbox({ componentType, areaM2, variableLoadKn = 0, combinationType }) {
  const component = getComponentDefinition(componentType);
  assertPositiveFiniteNumber(areaM2, 'Areal');

  const draft = {
    componentType,
    componentLabel: component.label,
    category: component.category,
    areaM2,
    variableLoadKn,
    combinationType: combinationType || 'ulsPersistentTransient',
    layers: [
      {
        layerId: 'base',
        materialId: component.defaultMaterialId,
        ratio: 1
      }
    ],
    history: []
  };

  return {
    ...draft,
    ratioSummary: getRatioSummary(draft)
  };
}

export function upsertSandboxLayer(draft, { layerId, materialId, ratio }) {
  assertDraftShape(draft);

  const normalizedLayerId = String(layerId || '').trim();
  if (!normalizedLayerId) {
    throw new Error('Lag-id er påkrævet.');
  }

  const material = getMaterialById(materialId);
  if (!material) {
    throw new Error('Ukendt materiale-id.');
  }

  const valueRatio = ratio ?? 1;
  assertLayerRatio(valueRatio);

  const nextDraft = cloneDraft(draft);
  const existingIndex = nextDraft.layers.findIndex((item) => item.layerId === normalizedLayerId);
  const nextLayer = {
    layerId: normalizedLayerId,
    materialId: material.id,
    ratio: valueRatio
  };

  if (existingIndex === -1) {
    nextDraft.layers.push(nextLayer);
  } else {
    nextDraft.layers[existingIndex] = nextLayer;
  }

  const withHistory = withHistorySnapshot(nextDraft, draft);
  return {
    ...withHistory,
    ratioSummary: getRatioSummary(withHistory)
  };
}

export function removeSandboxLayer(draft, layerId) {
  assertDraftShape(draft);

  const normalizedLayerId = String(layerId || '').trim();
  if (!normalizedLayerId) {
    throw new Error('Lag-id er påkrævet.');
  }

  const nextDraft = cloneDraft(draft);
  nextDraft.layers = nextDraft.layers.filter((item) => item.layerId !== normalizedLayerId);

  if (nextDraft.layers.length === 0) {
    throw new Error('Draft skal indeholde mindst ét lag.');
  }

  const withHistory = withHistorySnapshot(nextDraft, draft);
  return {
    ...withHistory,
    ratioSummary: getRatioSummary(withHistory)
  };
}

export function rollbackSandboxDraft(draft) {
  assertDraftShape(draft);

  const history = Array.isArray(draft.history) ? [...draft.history] : [];
  if (history.length === 0) {
    throw new Error('Der er ingen historik at rulle tilbage til.');
  }

  const previous = history.pop();
  const restored = {
    ...previous,
    history
  };
  assertDraftShape(restored);

  return {
    ...restored,
    ratioSummary: getRatioSummary(restored)
  };
}

export function calculateSandboxEstimate(draft) {
  assertDraftShape(draft);

  const layerLoads = draft.layers.map((layer) => buildLayerLoadEntry(draft, layer));
  const permanentLoadKn = layerLoads.reduce((sum, item) => sum + item.deadLoadKn, 0);

  const combination = combineLoads({
    permanentLoadKn,
    variableLoadKn: draft.variableLoadKn ?? 0,
    combinationType: draft.combinationType || 'ulsPersistentTransient'
  });

  const draftSnapshot = cloneDraft(draft);
  const ratioSummary = getRatioSummary(draftSnapshot);

  return {
    draft: {
      ...draftSnapshot,
      ratioSummary
    },
    layerLoads,
    permanentLoadKn,
    combination,
    ratioSummary
  };
}



export function compareSandboxScenarios(leftDraft, rightDraft) {
  const left = calculateSandboxEstimate(leftDraft);
  const right = calculateSandboxEstimate(rightDraft);

  return {
    left: {
      draft: left.draft,
      permanentLoadKn: left.permanentLoadKn,
      combinedKn: left.combination.combinedKn
    },
    right: {
      draft: right.draft,
      permanentLoadKn: right.permanentLoadKn,
      combinedKn: right.combination.combinedKn
    },
    delta: {
      permanentLoadKn: right.permanentLoadKn - left.permanentLoadKn,
      combinedKn: right.combination.combinedKn - left.combination.combinedKn
    }
  };
}

export function calculateDeadLoad(materialId, areaM2) {
  const material = getMaterialById(materialId);
  if (!material) {
    throw new Error('Ukendt materiale-id.');
  }

  assertPositiveFiniteNumber(areaM2, 'Areal');

  return {
    materialId,
    areaM2,
    deadLoadKn: material.densityKnM2 * areaM2,
    source: material.source
  };
}

export function calculateLineLoad(materialId, widthM) {
  const material = getMaterialById(materialId);
  if (!material) {
    throw new Error('Ukendt materiale-id.');
  }

  assertPositiveFiniteNumber(widthM, 'Bredde');

  return {
    materialId,
    widthM,
    lineLoadKnPerM: material.densityKnM2 * widthM,
    source: material.source
  };
}

export function calculatePointLoad(materialId, influenceAreaM2) {
  const deadLoad = calculateDeadLoad(materialId, influenceAreaM2);

  return {
    materialId,
    influenceAreaM2,
    pointLoadKn: deadLoad.deadLoadKn,
    source: deadLoad.source
  };
}

export function combineLoads({
  permanentLoadKn,
  variableLoadKn = 0,
  combinationType = 'ulsPersistentTransient'
}) {
  assertPositiveFiniteNumber(permanentLoadKn, 'Permanent last');
  if (!Number.isFinite(variableLoadKn) || variableLoadKn < 0) {
    throw new Error('Variabel last skal være et nul-eller-positivt tal.');
  }

  const factors = getCombinationFactors(combinationType);

  const combinedKn =
    factors.gammaG * permanentLoadKn +
    factors.gammaQLeading * factors.psi0Leading * variableLoadKn;

  return {
    combinationType,
    permanentLoadKn,
    variableLoadKn,
    combinedKn,
    factors
  };
}
