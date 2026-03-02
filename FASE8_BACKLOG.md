# Fase 8 backlog – release governance og rapportvisning

## Step 8.0–8.3 (færdiggjort)
- [x] Release candidate-model med version/miljø og godkendelser.
- [x] Godkendelsesflow for technical/business.
- [x] Eksport af release-rapport i to visninger:
  - internal (fuld rapport + traceability)
  - customer (filtreret summary)
- [x] API endpoints:
  - `POST /api/release/candidate`
  - `POST /api/release/approve`
  - `POST /api/release/export`
- [x] UI-sektion for release governance.

## Næste steps
- [ ] Knyt approval til brugerroller og signaturspor.
- [ ] Versionér og arkivér release artifacts.
- [ ] Automatisér promotion fra staging til produktion med rollback policy.
