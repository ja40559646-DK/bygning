# Fase 6 backlog – beregningsmotor

## Step 6.0–6.3 (færdiggjort)
- [x] Etableret separat beregningsmotor-modul i `packages/calculation-engine`.
- [x] Konvertering: areallast -> linjelast -> punktlast pr. komponent.
- [x] Lastretninger understøttet (`x`, `y`, `z+`, `z-`) med summering pr. retning.
- [x] ULS/SLS kombinationer via profil (`dkNaBasic`).
- [x] Rapportobjekt med sporbarhed (kilder, formler og komponent-trace).
- [x] API endpoints:
  - `GET /api/engine/profiles`
  - `POST /api/engine/calculate`
- [x] UI-sektion til test af beregningsmotoren.
- [x] Unit tests for motor og API.

## Næste steps
- [ ] Referencecase-bibliotek med golden outputs og regressionssnapshot.
- [ ] Versionering af profiler/formler med changelog og migreringsnoter.
- [ ] Eksport af rapport i kundevisning vs intern ingeniørvisning.
