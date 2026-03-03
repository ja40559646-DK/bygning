function isPoint(value) {
  return value && Number.isFinite(value.x) && Number.isFinite(value.y);
}

function segmentIntersect(a, b, c, d) {
  function orient(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  }

  function onSegment(p, q, r) {
    return (
      Math.min(p.x, r.x) <= q.x &&
      q.x <= Math.max(p.x, r.x) &&
      Math.min(p.y, r.y) <= q.y &&
      q.y <= Math.max(p.y, r.y)
    );
  }

  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);

  if (o1 * o2 < 0 && o3 * o4 < 0) {
    return true;
  }

  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;
  return false;
}

export function validatePolygon(points) {
  const errors = [];

  if (!Array.isArray(points) || points.length < 3) {
    return { valid: false, errors: ['Polygon skal have mindst 3 punkter.'] };
  }

  for (const [index, point] of points.entries()) {
    if (!isPoint(point)) {
      errors.push(`Punkt ${index + 1} er ugyldigt.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  for (let i = 0; i < points.length; i += 1) {
    const a1 = points[i];
    const a2 = points[(i + 1) % points.length];

    for (let j = i + 1; j < points.length; j += 1) {
      const b1 = points[j];
      const b2 = points[(j + 1) % points.length];

      const adjacent = Math.abs(i - j) <= 1 || (i === 0 && j === points.length - 1);
      if (adjacent) {
        continue;
      }

      if (segmentIntersect(a1, a2, b1, b2)) {
        errors.push('Polygon har selvkrydsende linjer.');
        return { valid: false, errors };
      }
    }
  }

  return { valid: true, errors: [] };
}

export function calculatePolygonArea(points) {
  const validation = validatePolygon(points);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += current.x * next.y - next.x * current.y;
  }

  return Math.abs(sum) / 2;
}

export function createWorkArea(name, points) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    throw new Error('Arbejdsområde skal have et navn.');
  }

  const area = calculatePolygonArea(points);
  return {
    name: trimmedName,
    points,
    areaM2: area
  };
}
