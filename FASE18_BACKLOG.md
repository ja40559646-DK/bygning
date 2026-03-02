# Fase 18 backlog – rollout plan og readiness

## Step 18.0–18.2 (færdiggjort)
- [x] Rollout-plan model med versions/miljø-step.
- [x] Readiness-evaluering med checks (backup/rollback/monitoring).
- [x] API endpoints:
  - `POST /api/phase18/rollout-plan`
  - `POST /api/phase18/rollout-readiness`
- [x] Egen visuel blok i UI for fase 18.
- [x] Tests for domæne og API.

## Næste steps
- [ ] Knyt readiness-resultat til deployment-job i CI/CD.
- [ ] Indfør staging->prod promotion med signoff-krav.
