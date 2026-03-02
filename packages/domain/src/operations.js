function assertNonEmptyString(value, fieldName) {
  if (!String(value || '').trim()) {
    throw new Error(`${fieldName} er påkrævet.`);
  }
}

function assertBoolean(value, fieldName) {
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} skal være true/false.`);
  }
}

const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'];

export function createIncident({ title, severity = 'medium', service = 'api', details = '' }) {
  assertNonEmptyString(title, 'Titel');
  assertNonEmptyString(service, 'Service');

  if (!INCIDENT_SEVERITIES.includes(severity)) {
    throw new Error('Severity er ugyldig.');
  }

  return {
    id: `INC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    title: String(title).trim(),
    severity,
    service: String(service).trim(),
    details: String(details || '').trim(),
    status: 'open',
    createdAt: new Date().toISOString(),
    closedAt: null
  };
}

export function closeIncident(incident, resolutionNote = '') {
  if (!incident || !incident.id) {
    throw new Error('Incident er ugyldig.');
  }

  if (incident.status === 'closed') {
    return incident;
  }

  return {
    ...incident,
    status: 'closed',
    resolutionNote: String(resolutionNote || '').trim(),
    closedAt: new Date().toISOString()
  };
}

export function summarizeOperations({ incidents, checks }) {
  if (!Array.isArray(incidents)) {
    throw new Error('Incidents skal være en liste.');
  }

  const normalizedChecks = {
    security: Boolean(checks?.security),
    tests: Boolean(checks?.tests),
    backups: Boolean(checks?.backups),
    monitoring: Boolean(checks?.monitoring),
    rollbackPlan: Boolean(checks?.rollbackPlan)
  };

  const openIncidents = incidents.filter((incident) => incident.status !== 'closed');
  const criticalOpen = openIncidents.filter((incident) => incident.severity === 'critical').length;
  const checksPassed = Object.values(normalizedChecks).every(Boolean);

  return {
    incidents: {
      total: incidents.length,
      open: openIncidents.length,
      criticalOpen
    },
    checks: normalizedChecks,
    goLiveReady: checksPassed && criticalOpen === 0,
    generatedAt: new Date().toISOString()
  };
}

export function evaluateDrillReadiness({ backupRestoreOk, failoverOk, alertingOk }) {
  assertBoolean(backupRestoreOk, 'Backup/restore-status');
  assertBoolean(failoverOk, 'Failover-status');
  assertBoolean(alertingOk, 'Alerting-status');

  const score = [backupRestoreOk, failoverOk, alertingOk].filter(Boolean).length;

  return {
    score,
    maxScore: 3,
    readinessLevel: score === 3 ? 'ready' : score === 2 ? 'warning' : 'blocked',
    checklist: {
      backupRestoreOk,
      failoverOk,
      alertingOk
    }
  };
}
