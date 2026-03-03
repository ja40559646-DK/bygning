# Bygning

Minimal og modulær projektstruktur til udvikling af værktøj for bygningsplanlægning, placering på matrikler og senere lastberegninger.

## Struktur
- `apps/web` – frontend (UI/kort/tegneværktøj)
- `apps/api` – backend API (projekter, auth, data)
- `packages/domain` – domænemodeller og validering
- `packages/calculation-engine` – beregningskerne (versioneret)
- `packages/shared` – fælles typer, utils og contracts
- `scripts` – hjælpeværktøjer (fx setup-kontrol)
- `SECURITY_BASELINE.md` – sikkerhedsbaseline v1 (trusselsmodel, audit, backup)
- `CALCULATION_GOVERNANCE.md` – governance for formler, versioner og referencecases
- `GATE_CHECKLIST.md` – checklister for G0–G7 + godkendelsesflow
- `FASE1_BACKLOG.md` – fase 1 backlog for intake og adgang
- `FASE2_BACKLOG.md` – fase 2 backlog for geometri og arbejdsområde
- `FASE3_BACKLOG.md` – fase 3 backlog for materialer og lastgrundlag
- `FASE4_BACKLOG.md` – fase 4 backlog for facader og gavle
- `FASE5_BACKLOG.md` – fase 5 backlog for lastlinjer
- `FASE6_BACKLOG.md` – fase 6 backlog for beregningsmotor
- `FASE7_BACKLOG.md` – fase 7 backlog for drift og monitorering
- `FASE8_BACKLOG.md` – fase 8 backlog for release governance
- `FASE9_BACKLOG.md` – fase 9 backlog for try-now klargøring
- `FASE10_BACKLOG.md` – fase 10 backlog for pilot-flow og feedback-loop
- `FASE11_BACKLOG.md` – fase 11 backlog for feedbackindsamling
- `FASE12_BACKLOG.md` – fase 12 backlog for prioriteringsloop
- `FASE13_BACKLOG.md` – fase 13 backlog for KPI-dashboard
- `FASE14_BACKLOG.md` – fase 14 backlog for quality snapshots
- `FASE15_BACKLOG.md` – fase 15 backlog for pilot trends og alarmer
- `FASE16_BACKLOG.md` – fase 16 backlog for reference cases
- `FASE17_BACKLOG.md` – fase 17 backlog for gate review
- `FASE18_BACKLOG.md` – fase 18 backlog for rollout plan

## Nuværende status
- Fase 0, Step 0.1–0.5 er etableret (struktur + kvalitet + sikkerhed + governance + gates).
- Fase 1, Step 1.1–1.9 er færdiggjort (intake + OTP + API handlers + tests).
- Fase 2, Step 2.1–2.4 er færdiggjort (polygonvalidering + arbejdsområde).
- Fase 3, Step 3.0–3.9 er færdiggjort (materialekatalog + egenlast + kildespor + ULS/SLS + linje-/punktlast + database + API/UI lastberegning + komponentstyring + sandbox + presets + rollback + A/B-sammenligning).
- Fase 4, Step 4.0–4.3 er færdiggjort (facade/gavl preview + gavlretning + profil + envelope-afledning + sandbox-kobling).
- Fase 5, Step 5.0–5.3 er færdiggjort (lastlinjer + projektion + konfliktdetektion + API/UI).
- Fase 6, Step 6.0–6.3 er færdiggjort (beregningsmotor + retninger + ULS/SLS + sporbar rapport + API/UI).
- Fase 7, Step 7.0–7.3 er færdiggjort (drift + incidents + go-live readiness + API/UI).
- Fase 8, Step 8.0–8.3 er færdiggjort (release governance + approval + eksportvisninger + API/UI).
- Fase 9, Step 9.0–9.2 er færdiggjort (try-now klargøring + meta status/guide + API/UI).
- Fase 10, Step 10.0–10.2 er færdiggjort (pilot-flow + onboarding guide + readiness signal).
- Fase 11, Step 11.0–11.2 er færdiggjort (feedbackindsamling + API/UI).
- Fase 12, Step 12.0–12.2 er færdiggjort (prioriteringsloop + API/UI).
- Fase 13, Step 13.0–13.2 er færdiggjort (KPI-dashboard + API/UI).
- Fase 14, Step 14.0–14.2 er færdiggjort (quality snapshots + regression signal + API/UI).
- Fase 15, Step 15.0–15.2 er færdiggjort (pilot trends + thresholds + alerts + API/UI).
- Fase 16, Step 16.0–16.2 er færdiggjort (reference cases + API/UI).
- Fase 17, Step 17.0–17.2 er færdiggjort (gate review + API/UI).
- Fase 18, Step 18.0–18.2 er færdiggjort (rollout plan + readiness + API/UI).
- Visuel prototype v1 er tilgængelig på `/` (intake + OTP test-UI).
- Visuel prototype v2 har canvas-baseret arbejdsområde preview.
- Visuel prototype v3 har driftsstatus-panel og hjælpetekster i UI.
- Visuel prototype v4 kan gemme og liste objekter (hus/skur/carport/terrasse) fra tegnet arbejdsområde.
- Visuel prototype v5 har materialedatabasevisning samt samlet lastberegning (dead/line/point/combination).
- Visuel prototype v6 har komponentvalg (væg/gulv/tag) med materialeforslag og komponent-estimat.
- Visuel prototype v7 har sikkert sandbox-miljø til lagvis udskiftning uden sideeffekt.
- Visuel prototype v8 har preset-bibliotek for hurtig væg/gulv/tag-opbygning.
- Visuel prototype v9 har sandbox rollback (revisionshistorik) for sikre eksperimenter.
- Visuel prototype v10 har A/B sammenligning af alternative opbygninger.
- Visuel prototype v11 har facade/gavl preview med envelope-arealer.
- Visuel prototype v12 har fuldt fase 4 workflow inkl. gavlretning, profiler og sandbox-kobling.
- Visuel prototype v13 har fase 5 lastlinje-workflow med projektion og konfliktkontrol.
- Visuel prototype v14 har fase 6 beregningsmotor med retningsspecifik ULS/SLS rapport.
- Visuel prototype v15 har fase 7 driftspanel (incidents + readiness).
- Visuel prototype v16 har fase 8 release governance med customer/internal eksport.
- Visuel prototype v17 har fase 9/10 panel med live fase-status og try-now guide.
- Visuel prototype v18 har fase 11–13 panel for feedback, prioritering og KPI.
- Visuel prototype v19 har fase 14–15 panel for quality snapshots og pilot-alerts.
- Visuel prototype v20 har separate blokke for fase 16, 17 og 18.

## Kørsel og checks
App-runtime er klar lokalt. Kør følgende:

```bash
npm run security
npm run lint
npm run test
npm run start:api
bash scripts/check-github-setup.sh --local-only
```

## Arbejdsform
- Små, afsluttede step med tydelige acceptkriterier.
- Kvalitetsgates før næste fase.
- Beregningsmodeller dokumenteres med kildehenvisninger (BR18/DS/EN/NA) før produktion.

## Fuldt download til GitHub-import
Hvis du vil have hele projektet med historik som en fil, kan du lave en eksport-pakke:

```bash
bash scripts/create-github-import-bundle.sh
```

Det laver i mappen `export/`:
- `*.bundle` (fuld git-historik + branches, bedst til GitHub-import)
- `*.tar.gz` (snapshot af nuværende kode)
- `*.manifest.txt` (trin-for-trin importguide)

For fuld import til GitHub: clone fra `.bundle` og push til dit GitHub-repo (se `manifest` eller `GITHUB_SETUP.md`).
