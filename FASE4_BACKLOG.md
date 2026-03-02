# Fase 4 backlog – facader og gavle

## Step 4.0–4.3 (færdiggjort)
- [x] Basal facade/gavl-preview model (2D) med længde/bredde/væghøjde/gavlhøjde.
- [x] Beregning af facade-envelope arealer (lang facade, kort facade, gavltrekant, total).
- [x] API endpoint `POST /api/facade/preview`.
- [x] Interaktiv markering af 2 parallelle linjer som gavlretning i tegneværktøj/polygon (`POST /api/facade/select-gable-direction`).
- [x] Gavlprofil-tegning med spejling til modsat ende (`POST /api/facade/gable-profile`).
- [x] Afledt facade-envelope fra valgt gavlretning (`POST /api/facade/envelope-from-selection`).
- [x] Kobling mellem facadeflader og materiale-lag fra sandbox (`POST /api/facade/couple-sandbox`).
- [x] UI-sektion til hele fase 4 workflow med preview, gavlretning, profil, envelope-afledning og sandbox-kobling.
- [x] Unit tests for facadeberegning og API-flow.

## Næste steps
- [ ] Udvid med egentlig flade-objekter pr. facade (nord/syd/øst/vest + gavltrekanter) for materialevalg pr. flade.
- [ ] Tilføj visualisering af valgte gavllinjer direkte på canvas (farvekodede kanter).
- [ ] Kobl facade-loads ind i samlet projektlast med eksport til referencecase.
