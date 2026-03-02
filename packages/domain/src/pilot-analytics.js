function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function buildPilotTrendSeries(entries) {
  const safeEntries = Array.isArray(entries) ? entries : [];

  return safeEntries.map((entry, index) => ({
    day: entry.day || `D${index + 1}`,
    activationRate: toNumber(entry.activationRate),
    completionRate: toNumber(entry.completionRate),
    errorRate: toNumber(entry.errorRate)
  }));
}

export function detectPilotAlerts(series, thresholds = {}) {
  const trend = buildPilotTrendSeries(series);
  const activationMin = toNumber(thresholds.activationMin ?? 0.6);
  const completionMin = toNumber(thresholds.completionMin ?? 0.5);
  const errorMax = toNumber(thresholds.errorMax ?? 0.2);

  const alerts = [];

  for (const item of trend) {
    if (item.activationRate < activationMin) {
      alerts.push({ day: item.day, type: 'low-activation', value: item.activationRate, threshold: activationMin });
    }
    if (item.completionRate < completionMin) {
      alerts.push({ day: item.day, type: 'low-completion', value: item.completionRate, threshold: completionMin });
    }
    if (item.errorRate > errorMax) {
      alerts.push({ day: item.day, type: 'high-error-rate', value: item.errorRate, threshold: errorMax });
    }
  }

  return {
    trend,
    thresholds: { activationMin, completionMin, errorMax },
    alerts,
    hasAlerts: alerts.length > 0
  };
}
