function assertPositive(value, fieldName) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} skal være et positivt tal.`);
  }
}

function assertPoint(point, fieldName) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`${fieldName} er ugyldigt.`);
  }
}

function normalizePoint(point) {
  return {
    x: Number(point.x),
    y: Number(point.y)
  };
}

function segmentLength(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function orientation(a, b, c) {
  const cross = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(cross) < 1e-9) {
    return 0;
  }
  return cross > 0 ? 1 : 2;
}

function onSegment(a, b, c) {
  return (
    b.x <= Math.max(a.x, c.x) + 1e-9 &&
    b.x + 1e-9 >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) + 1e-9 &&
    b.y + 1e-9 >= Math.min(a.y, c.y)
  );
}

function segmentsIntersect(firstFrom, firstTo, secondFrom, secondTo) {
  const o1 = orientation(firstFrom, firstTo, secondFrom);
  const o2 = orientation(firstFrom, firstTo, secondTo);
  const o3 = orientation(secondFrom, secondTo, firstFrom);
  const o4 = orientation(secondFrom, secondTo, firstTo);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  if (o1 === 0 && onSegment(firstFrom, secondFrom, firstTo)) {
    return true;
  }
  if (o2 === 0 && onSegment(firstFrom, secondTo, firstTo)) {
    return true;
  }
  if (o3 === 0 && onSegment(secondFrom, firstFrom, secondTo)) {
    return true;
  }
  if (o4 === 0 && onSegment(secondFrom, firstTo, secondTo)) {
    return true;
  }

  return false;
}

export function validateLoadLine(line) {
  const id = String(line?.id || '').trim();
  if (!id) {
    throw new Error('Lastlinje mangler id.');
  }

  const points = Array.isArray(line?.points) ? line.points.map(normalizePoint) : [];
  if (points.length < 2) {
    throw new Error('Lastlinje skal have mindst to punkter.');
  }

  for (let index = 0; index < points.length; index += 1) {
    assertPoint(points[index], `Punkt ${index + 1}`);
  }

  return {
    id,
    label: String(line.label || id),
    points
  };
}

export function projectLoadLines({ lines, envelopeDepthM }) {
  assertPositive(envelopeDepthM, 'Bygningsdybde');
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('Der skal angives mindst én lastlinje.');
  }

  const normalizedLines = lines.map(validateLoadLine);

  const projected = normalizedLines
    .map((line) => ({
      lineId: line.id,
      label: line.label,
      front: line.points.map((point) => ({ x: point.x, y: point.y, z: 0 })),
      back: line.points.map((point) => ({ x: point.x, y: point.y, z: envelopeDepthM }))
    }))
    .sort((left, right) => left.lineId.localeCompare(right.lineId));

  return {
    envelopeDepthM,
    projected
  };
}

export function detectLoadLineConflicts(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('Der skal angives mindst én lastlinje.');
  }

  const normalizedLines = lines.map(validateLoadLine);
  const conflicts = [];

  for (const line of normalizedLines) {
    for (let index = 0; index < line.points.length - 1; index += 1) {
      const from = line.points[index];
      const to = line.points[index + 1];
      if (segmentLength(from, to) <= 1e-9) {
        conflicts.push({
          type: 'broken-segment',
          lineId: line.id,
          segmentIndex: index,
          message: 'Lastlinjen indeholder et afbrudt segment (nul-længde).'
        });
      }
    }
  }

  for (let leftIndex = 0; leftIndex < normalizedLines.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < normalizedLines.length; rightIndex += 1) {
      const left = normalizedLines[leftIndex];
      const right = normalizedLines[rightIndex];

      for (let leftSegmentIndex = 0; leftSegmentIndex < left.points.length - 1; leftSegmentIndex += 1) {
        const leftFrom = left.points[leftSegmentIndex];
        const leftTo = left.points[leftSegmentIndex + 1];

        for (let rightSegmentIndex = 0; rightSegmentIndex < right.points.length - 1; rightSegmentIndex += 1) {
          const rightFrom = right.points[rightSegmentIndex];
          const rightTo = right.points[rightSegmentIndex + 1];

          if (segmentsIntersect(leftFrom, leftTo, rightFrom, rightTo)) {
            conflicts.push({
              type: 'crossing-lines',
              lineId: left.id,
              otherLineId: right.id,
              segmentIndex: leftSegmentIndex,
              otherSegmentIndex: rightSegmentIndex,
              message: 'Lastlinjer krydser hinanden.'
            });
          }
        }
      }
    }
  }

  const sortedConflicts = conflicts.sort((left, right) => {
    const leftKey = `${left.type}|${left.lineId}|${left.otherLineId || ''}|${left.segmentIndex}`;
    const rightKey = `${right.type}|${right.lineId}|${right.otherLineId || ''}|${right.segmentIndex}`;
    return leftKey.localeCompare(rightKey);
  });

  return {
    lineCount: normalizedLines.length,
    conflicts: sortedConflicts,
    isValid: sortedConflicts.length === 0
  };
}

export function previewLoadLineWorkflow({ lines, envelopeDepthM }) {
  const projection = projectLoadLines({ lines, envelopeDepthM });
  const validation = detectLoadLineConflicts(lines);

  return {
    projection,
    validation
  };
}
