const CATEGORIES = ['ux', 'calculation', 'performance', 'error'];

function assertNonEmpty(value, fieldName) {
  if (!String(value || '').trim()) {
    throw new Error(`${fieldName} er påkrævet.`);
  }
}

function assertCategory(value) {
  if (!CATEGORIES.includes(value)) {
    throw new Error('Kategori er ugyldig.');
  }
}

export function submitFeedback({ title, category, severity = 3, note = '', userId = 'pilot-user' }) {
  assertNonEmpty(title, 'Titel');
  assertCategory(category);

  if (!Number.isFinite(severity) || severity < 1 || severity > 5) {
    throw new Error('Severity skal være mellem 1 og 5.');
  }

  return {
    id: `FDB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    title: String(title).trim(),
    category,
    severity,
    note: String(note || '').trim(),
    userId: String(userId || 'pilot-user').trim(),
    status: 'new',
    createdAt: new Date().toISOString()
  };
}

export function prioritizeFeedback(items) {
  if (!Array.isArray(items)) {
    throw new Error('Feedback-items skal være en liste.');
  }

  const ranked = items
    .map((item) => ({
      ...item,
      priorityScore: Number(item.severity || 0) * (item.category === 'error' ? 3 : item.category === 'calculation' ? 2 : 1)
    }))
    .sort((left, right) => right.priorityScore - left.priorityScore || left.createdAt.localeCompare(right.createdAt));

  return {
    ranked,
    top: ranked[0] || null
  };
}

export function calculatePilotKpis({ sessions, feedbackItems }) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeFeedback = Array.isArray(feedbackItems) ? feedbackItems : [];

  const activatedSessions = safeSessions.filter((item) => item.activated).length;
  const completedFlows = safeSessions.filter((item) => item.completedFlow).length;
  const errorFeedback = safeFeedback.filter((item) => item.category === 'error').length;

  const activationRate = safeSessions.length === 0 ? 0 : activatedSessions / safeSessions.length;
  const completionRate = safeSessions.length === 0 ? 0 : completedFlows / safeSessions.length;
  const errorRate = safeFeedback.length === 0 ? 0 : errorFeedback / safeFeedback.length;

  return {
    sampleSize: {
      sessions: safeSessions.length,
      feedback: safeFeedback.length
    },
    activationRate,
    completionRate,
    errorRate,
    generatedAt: new Date().toISOString()
  };
}
