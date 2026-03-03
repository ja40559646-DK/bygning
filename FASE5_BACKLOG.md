# Fase 5 backlog – lastlinjer

## Step 5.0–5.3 (færdiggjort)
- [x] Domænemodel for lastlinjer med validering af linjestruktur.
- [x] Projektion af lastlinjer gennem bygningsdybde (front/back) med deterministisk sortering.
- [x] Konfliktdetektion for krydsende og afbrudte (nul-længde) segmenter.
- [x] Samlet workflow-endpoint for projektion + konfliktkontrol.
- [x] API endpoints:
  - `POST /api/load-lines/project`
  - `POST /api/load-lines/conflicts`
  - `POST /api/load-lines/preview`
- [x] UI-sektion for fase 5 med interaktive test-input.
- [x] Unit tests for domæne og API.

## Næste steps
- [ ] Knyt lastlinjer direkte til facadeflader og knudepunkter fra fase 4-geometri.
- [ ] Tilføj snapping-regler til hjørner/kanter i canvas.
- [ ] Introducér referencecases for geometrisk konsistens (G5) med golden outputs.
