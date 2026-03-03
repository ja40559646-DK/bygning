import test from 'node:test';
import assert from 'node:assert/strict';
import {
  coupleFacadeWithSandbox,
  createMirroredGableProfile,
  estimateFacadeEnvelopeFromSelection,
  estimateFacadeSurfaces,
  selectParallelGableEdges
} from '../src/facade-workflow.js';

const rectangle = [
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: 12, y: 8 },
  { x: 0, y: 8 }
];

test('estimateFacadeSurfaces calculates wall and gable surfaces', () => {
  const result = estimateFacadeSurfaces({
    buildingLengthM: 12,
    buildingWidthM: 8,
    wallHeightM: 2.8,
    gableHeightM: 1.6
  });

  assert.ok(Math.abs(result.areas.longFacadeAreaM2 - 33.6) < 1e-9);
  assert.ok(Math.abs(result.areas.gableTriangleAreaM2 - 6.4) < 1e-9);
  assert.ok(Math.abs(result.areas.totalFacadeEnvelopeM2 - 124.8) < 1e-9);
});

test('selectParallelGableEdges finds parallel edges and span', () => {
  const selection = selectParallelGableEdges({
    points: rectangle,
    firstEdgeIndex: 0,
    secondEdgeIndex: 2
  });

  assert.ok(selection.orientation.angleDeg < 1e-9);
  assert.equal(selection.firstEdge.lengthM, 12);
  assert.equal(selection.orientation.spanM, 8);
});

test('createMirroredGableProfile returns mirrored triangle profile', () => {
  const profile = createMirroredGableProfile({
    spanM: 8,
    wallHeightM: 2.8,
    ridgeHeightM: 4.4
  });

  assert.equal(profile.points.length, 3);
  assert.equal(profile.points[1].x, 4);
  assert.equal(profile.points[1].y, 4.4);
});

test('estimateFacadeEnvelopeFromSelection derives facade geometry from selected edges', () => {
  const selection = selectParallelGableEdges({
    points: rectangle,
    firstEdgeIndex: 0,
    secondEdgeIndex: 2
  });

  const facade = estimateFacadeEnvelopeFromSelection({
    points: rectangle,
    gableSelection: selection,
    wallHeightM: 2.8,
    ridgeHeightM: 4.4
  });

  assert.equal(facade.geometry.buildingLengthM, 12);
  assert.equal(facade.geometry.buildingWidthM, 8);
  assert.ok(Math.abs(facade.areas.totalFacadeEnvelopeM2 - 124.8) < 1e-9);
});

test('coupleFacadeWithSandbox combines wall/gable and roof loads', () => {
  const facade = estimateFacadeSurfaces({
    buildingLengthM: 12,
    buildingWidthM: 8,
    wallHeightM: 2.8,
    gableHeightM: 1.6
  });

  const result = coupleFacadeWithSandbox({
    facade,
    wallLoadPerM2: 1.2,
    roofLoadPerM2: 0.9
  });

  assert.ok(Math.abs(result.wallLoadKn - 134.4) < 1e-9);
  assert.ok(Math.abs(result.roofLoadKn - 86.4) < 1e-9);
  assert.ok(Math.abs(result.totalEnvelopeLoadKn - 236.16) < 1e-9);
});

test('estimateFacadeSurfaces rejects negative gable height', () => {
  assert.throws(
    () => estimateFacadeSurfaces({ buildingLengthM: 10, buildingWidthM: 8, wallHeightM: 3, gableHeightM: -1 }),
    /Gavlhøjde/
  );
});
