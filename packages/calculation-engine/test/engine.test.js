import test from 'node:test';
import assert from 'node:assert/strict';
import { listCombinationProfiles, runCalculationEngine } from '../src/engine.js';

test('listCombinationProfiles returns dkNaBasic', () => {
  const profiles = listCombinationProfiles();
  assert.equal(profiles[0].id, 'dkNaBasic');
});

test('runCalculationEngine converts area to line and point loads with combinations', () => {
  const result = runCalculationEngine({
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
  });

  assert.equal(result.componentResults[0].results.areaLoadKn, 24);
  assert.ok(Math.abs(result.componentResults[0].results.lineLoadKnPerM - 0.36) < 1e-9);
  assert.ok(Math.abs(result.componentResults[0].results.pointLoadKn - 2.4) < 1e-9);
  assert.ok(result.combinations['z-'].ulsKn > result.combinations['z-'].slsKn);
});

test('runCalculationEngine rejects invalid direction', () => {
  assert.throws(
    () =>
      runCalculationEngine({
        components: [
          {
            direction: 'north',
            areaM2: 10,
            loadKnPerM2: 1,
            tributaryWidthM: 0.2,
            influenceAreaM2: 1
          }
        ]
      }),
    /Retning/
  );
});
