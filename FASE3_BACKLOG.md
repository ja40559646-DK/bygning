# Fase 3 backlog – bygningsinformation og materialer

## Step 3.0 (færdiggjort)
- [x] Materialekatalog v1 med 30 traditionelle elementer.
- [x] Lookup på materiale-id.
- [x] Basal egenlastberegning (kN) = materialedensitet (kN/m²) * areal.
- [x] Unit tests for katalog og beregning.

## Step 3.1 (færdiggjort)
- [x] Kildereference pr. materiale (DS/EN/NA/BR18-spor).
- [x] Kildespor medtages i svar fra dead load-beregning.

## Step 3.2 (færdiggjort)
- [x] Udvidelse til lastkombinationer (ULS/SLS).
- [x] Linjelast-flow (kN/m) baseret på materialedensitet og strimmelbredde.
- [x] Punktlast-flow (kN) baseret på influensareal.
- [x] Unit tests for nye lastfunktioner og kombinationstyper.

## Step 3.3 (færdiggjort)
- [x] Traditionelle materialer flyttet til database-struktur (`materials.traditional.json`).
- [x] Materialekatalog loader nu data fra databasefil i stedet for hardcoded liste.
- [x] Validering af databasefelter ved indlæsning.

## Step 3.4 (færdiggjort)
- [x] API endpoint til liste af materialer (`GET /api/materials`).
- [x] API endpoint til ULS/SLS kombinationer (`GET /api/load-combinations`).
- [x] API endpoint til samlet lastberegning (`POST /api/materials/calculate-loads`).
- [x] UI-sektion til materialedatabase og beregning fra browser.

## Step 3.5 (færdiggjort)
- [x] Komponent-katalog for væg/gulv/tag med kategori-styring.
- [x] API til komponentliste, materialeforslag og komponent-estimat.
- [x] UI-flow til valg af flade/komponent og beregning med relevante materialer.

## Step 3.6 (færdiggjort)
- [x] Isoleret sandbox-model for komponentopbygning (lag kan byttes uden sideeffekt).
- [x] API-flow til create/upsert/remove/calculate af sandbox-draft.
- [x] UI-sektion til sikkert eksperimentmiljø før endelig lastberegning.

## Step 3.7 (færdiggjort)
- [x] Preset-bibliotek til væg/gulv/tag-opbygninger i sandbox.
- [x] API til preset-liste og anvendelse på draft.
- [x] Sikkerhedsregel: sum af lag-andele må ikke overstige 1.

## Step 3.8 (færdiggjort)
- [x] Revisionshistorik i sandbox-drafts (op til 20 trin).
- [x] API og UI til rollback af seneste ændring.
- [x] Ratio-summary i sandbox-estimat for hurtig validering af lagfordeling.

## Step 3.9 (færdiggjort)
- [x] A/B sammenligning af sandbox-drafts med last-delta.
- [x] API endpoint til sammenligning af to drafts.
- [x] UI-sektion til hurtig sammenligning af alternative opbygninger.

## Næste steps
- [ ] Biobaserede materialer v2.
