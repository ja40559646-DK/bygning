function assertPositive(value, fieldName) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} skal være et positivt tal.`);
  }
}

function assertNonNegative(value, fieldName) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} skal være et nul-eller-positivt tal.`);
  }
}

function assertPolygon(points) {
  if (!Array.isArray(points) || points.length < 3) {
    throw new Error('Polygon skal indeholde mindst 3 punkter.');
  }

  for (const point of points) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error('Polygon indeholder ugyldigt punkt.');
    }
  }
}

function getEdge(points, startIndex) {
  if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= points.length) {
    throw new Error('Kant-indeks er ugyldigt.');
  }

  const from = points[startIndex];
  const to = points[(startIndex + 1) % points.length];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthM = Math.hypot(dx, dy);

  if (lengthM <= 0) {
    throw new Error('Kantlængde skal være større end 0.');
  }

  return {
    startIndex,
    from,
    to,
    dx,
    dy,
    lengthM,
    unit: {
      x: dx / lengthM,
      y: dy / lengthM
    },
    midPoint: {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2
    }
  };
}

function edgeDistance(edge, point) {
  const nx = -edge.unit.y;
  const ny = edge.unit.x;
  return Math.abs((point.x - edge.from.x) * nx + (point.y - edge.from.y) * ny);
}

function polygonPerimeter(points) {
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    total += Math.hypot(points[next].x - points[index].x, points[next].y - points[index].y);
  }
  return total;
}

export function estimateFacadeSurfaces({ buildingLengthM, buildingWidthM, wallHeightM, gableHeightM }) {
  assertPositive(buildingLengthM, 'Bygningslængde');
  assertPositive(buildingWidthM, 'Bygningsbredde');
  assertPositive(wallHeightM, 'Væghøjde');
  assertNonNegative(gableHeightM, 'Gavlhøjde');

  const longFacadeAreaM2 = buildingLengthM * wallHeightM;
  const shortFacadeRectAreaM2 = buildingWidthM * wallHeightM;
  const gableTriangleAreaM2 = (buildingWidthM * gableHeightM) / 2;

  const wallSurfaceAreaM2 = longFacadeAreaM2 * 2 + shortFacadeRectAreaM2 * 2;
  const gableSurfaceAreaM2 = gableTriangleAreaM2 * 2;
  const totalFacadeEnvelopeM2 = wallSurfaceAreaM2 + gableSurfaceAreaM2;

  return {
    geometry: {
      buildingLengthM,
      buildingWidthM,
      wallHeightM,
      gableHeightM
    },
    areas: {
      longFacadeAreaM2,
      shortFacadeRectAreaM2,
      gableTriangleAreaM2,
      wallSurfaceAreaM2,
      gableSurfaceAreaM2,
      totalFacadeEnvelopeM2
    }
  };
}

export function selectParallelGableEdges({ points, firstEdgeIndex, secondEdgeIndex, maxDeviationDeg = 5 }) {
  assertPolygon(points);
  assertPositive(maxDeviationDeg, 'Maks afvigelse i grader');

  const first = getEdge(points, firstEdgeIndex);
  const second = getEdge(points, secondEdgeIndex);

  if (first.startIndex === second.startIndex) {
    throw new Error('Der skal vælges to forskellige kanter.');
  }

  const dot = first.unit.x * second.unit.x + first.unit.y * second.unit.y;
  const clampedDot = Math.min(1, Math.max(-1, Math.abs(dot)));
  const angleDeg = (Math.acos(clampedDot) * 180) / Math.PI;

  if (angleDeg > maxDeviationDeg) {
    throw new Error('Valgte kanter er ikke parallelle nok til gavlretning.');
  }

  const spanM = edgeDistance(first, second.midPoint);

  return {
    firstEdge: {
      index: first.startIndex,
      from: first.from,
      to: first.to,
      lengthM: first.lengthM
    },
    secondEdge: {
      index: second.startIndex,
      from: second.from,
      to: second.to,
      lengthM: second.lengthM
    },
    orientation: {
      directionVector: first.unit,
      angleDeg,
      spanM
    }
  };
}

export function createMirroredGableProfile({ spanM, wallHeightM, ridgeHeightM }) {
  assertPositive(spanM, 'Spændvidde');
  assertPositive(wallHeightM, 'Væghøjde');
  assertPositive(ridgeHeightM, 'Rygningshøjde');

  if (ridgeHeightM <= wallHeightM) {
    throw new Error('Rygningshøjde skal være større end væghøjde.');
  }

  const halfSpanM = spanM / 2;

  return {
    spanM,
    wallHeightM,
    ridgeHeightM,
    points: [
      { x: 0, y: wallHeightM },
      { x: halfSpanM, y: ridgeHeightM },
      { x: spanM, y: wallHeightM }
    ],
    mirrored: true
  };
}

export function estimateFacadeEnvelopeFromSelection({ points, gableSelection, wallHeightM, ridgeHeightM }) {
  assertPolygon(points);
  if (!gableSelection?.orientation?.spanM) {
    throw new Error('Gavlretning mangler span-data.');
  }

  const perimeterM = polygonPerimeter(points);
  const buildingLengthM = (gableSelection.firstEdge.lengthM + gableSelection.secondEdge.lengthM) / 2;
  const buildingWidthM = gableSelection.orientation.spanM;

  if (buildingLengthM * 2 >= perimeterM) {
    throw new Error('Polygon passer ikke til valgte gavlkanter.');
  }

  assertPositive(wallHeightM, 'Væghøjde');
  assertPositive(ridgeHeightM, 'Rygningshøjde');

  const gableHeightM = ridgeHeightM - wallHeightM;
  if (gableHeightM <= 0) {
    throw new Error('Rygningshøjde skal være større end væghøjde.');
  }

  const facade = estimateFacadeSurfaces({
    buildingLengthM,
    buildingWidthM,
    wallHeightM,
    gableHeightM
  });

  return {
    ...facade,
    source: {
      perimeterM,
      derivedFromPolygon: true
    }
  };
}

export function coupleFacadeWithSandbox({ facade, wallLoadPerM2, roofLoadPerM2 }) {
  const wallSurfaceAreaM2 = facade?.areas?.wallSurfaceAreaM2;
  const gableSurfaceAreaM2 = facade?.areas?.gableSurfaceAreaM2;
  const roofBaseAreaM2 = facade?.geometry?.buildingLengthM * facade?.geometry?.buildingWidthM;

  assertPositive(wallSurfaceAreaM2, 'Vægareal');
  assertNonNegative(gableSurfaceAreaM2, 'Gavlareal');
  assertPositive(roofBaseAreaM2, 'Taggrundareal');
  assertPositive(wallLoadPerM2, 'Væglast pr m²');
  assertPositive(roofLoadPerM2, 'Taglast pr m²');

  const wallLoadKn = wallSurfaceAreaM2 * wallLoadPerM2;
  const gableLoadKn = gableSurfaceAreaM2 * wallLoadPerM2;
  const roofLoadKn = roofBaseAreaM2 * roofLoadPerM2;

  return {
    wallLoadKn,
    gableLoadKn,
    roofLoadKn,
    totalEnvelopeLoadKn: wallLoadKn + gableLoadKn + roofLoadKn
  };
}
