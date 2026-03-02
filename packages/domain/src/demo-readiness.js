const PHASE_STATUS = [
  { phase: 0, status: 'completed', label: 'Fundament og governance' },
  { phase: 1, status: 'completed', label: 'Intake og OTP' },
  { phase: 2, status: 'completed', label: 'Geometri og arbejdsområde' },
  { phase: 3, status: 'completed', label: 'Materialer og sandbox' },
  { phase: 4, status: 'completed', label: 'Facader og gavle' },
  { phase: 5, status: 'completed', label: 'Lastlinjer' },
  { phase: 6, status: 'completed', label: 'Beregningsmotor' },
  { phase: 7, status: 'completed', label: 'Drift og monitorering' },
  { phase: 8, status: 'completed', label: 'Release governance' },
  { phase: 9, status: 'completed', label: 'Try-now klargøring' },
  { phase: 10, status: 'completed', label: 'Pilot-flow og feedback-loop' }
];

export function getPhaseStatus() {
  return {
    generatedAt: new Date().toISOString(),
    phases: PHASE_STATUS,
    readyForPilot: PHASE_STATUS.every((item) => item.status === 'completed')
  };
}

export function getTryNowGuide() {
  return {
    entrypoint: 'http://localhost:3000',
    prerequisites: ['Node.js 20+', 'npm install'],
    steps: [
      'npm install',
      'npm run start:api',
      'Åbn http://localhost:3000 i browser',
      'Kør intake -> OTP -> beregning -> release flow i UI-sektionerne 1-16'
    ],
    smokeChecks: ['GET /health', 'GET /api/meta/status', 'POST /api/engine/calculate'],
    support: 'Del fejloutput fra terminal + payload ved API-kald.'
  };
}
