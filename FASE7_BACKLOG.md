# Fase 7 backlog – drift, monitorering, go-live

## Step 7.0–7.3 (færdiggjort)
- [x] Incident-model med severity og livscyklus (open/closed).
- [x] Ops-summary med go-live readiness baseret på checks + åbne kritiske incidents.
- [x] Drill readiness-evaluering (backup/restore, failover, alerting).
- [x] API endpoints:
  - `POST /api/ops/incidents`
  - `POST /api/ops/incidents/close`
  - `POST /api/ops/summary`
  - `POST /api/ops/drill-readiness`
- [x] UI-sektion for drift/monitorering.

## Næste steps
- [ ] Tilknyt incidents til faktisk log-kilde og alarmkanal.
- [ ] Persistér incidenthistorik i database.
- [ ] Tilføj SLO/SLA-målinger over tid.
