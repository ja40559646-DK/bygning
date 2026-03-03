# Fase 0 backlog – fundament, sikkerhed og kvalitet

Status: Klar til opstart
Formål: Gøre projektet 100% køreklar før funktionel udvikling (Fase 1+).

---

## Mål for Fase 0 (Definition of Done)
- Arkitektur og modulgrænser er dokumenteret.
- Kvalitetsgate G0 kan bestås uden kritiske mangler.
- Basis for sikkerhed, test og release er etableret.

---

## Arbejdspakke 0.1 – Repo og struktur
- [x] Opret standard mappe-struktur:
  - `apps/web`
  - `apps/api`
  - `packages/domain`
  - `packages/calculation-engine`
  - `packages/shared`
- [x] Opret root `README.md` med run/build/test instruktioner.
- [x] Opret `.editorconfig` og formatteringstandard.

**Acceptkriterier**
- Ny udvikler kan clone repo og forstå struktur på under 10 minutter.

---

## Arbejdspakke 0.2 – Kvalitetspipeline
- [x] Opret linting + formatting checks.
- [x] Opret unit test runner.
- [x] Opret CI-workflow med minimum checks på hver PR.
- [x] Definer branch-strategi (main + feature branches + PR gate).

**Acceptkriterier**
- PR kan ikke merges hvis lint/test fejler.

---

## Arbejdspakke 0.3 – Sikkerhedsbaseline
- [x] Trusselsmodel v1 for auth, data og beregningssporbarhed.
- [x] Hemmeligheder håndteres via miljøvariabler/secrets manager.
- [x] Audit-log strategi (hvem ændrede hvad, hvornår).
- [x] Backup- og restore-plan v1.

**Acceptkriterier**
- Ingen hardcodede credentials i repo.
- Kritiske dataændringer er revisionssporbare.

---

## Arbejdspakke 0.4 – Beregningsgovernance
- [x] Definer format for formel-kildehenvisninger (DS/EN/NA/BR18).
- [x] Opret versioneringsprincip for calculation engine.
- [x] Opret template for referencecases (input, formel, forventet output).

**Acceptkriterier**
- Hver formel i motoren kan spores til en dokumenteret kilde.

---

## Arbejdspakke 0.5 – Kommunikation og gate-flow
- [x] Definer fase-godkendelsesflow (G0–G7).
- [x] Klargør mail-trigger krav:
  - Modtager: `ja40559646@gmail.com`
  - Emne: `Godkendelse af fase XX`
- [x] Definer godkendelseskriterier pr. gate i checkliste-form.

**Acceptkriterier**
- Der findes en entydig checkliste for “go/no-go” pr. gate.

---

## Kvalitetsgate G0 – Checkliste
- [ ] Arkitekturdiagram er godkendt.
- [ ] CI pipeline er grøn.
- [ ] Sikkerhedsbaseline v1 er godkendt.
- [ ] Beregningsgovernance er dokumenteret.
- [ ] Gate-checkliste og involveringspunkter er på plads.

Hvis alle punkter = ✅ => Fase 1 må startes.

---

## Tidsestimat (arbejdsdage)
- AP 0.1: 1 dag
- AP 0.2: 1–2 dage
- AP 0.3: 1–2 dage
- AP 0.4: 1 dag
- AP 0.5: 0.5 dag

**Samlet estimat:** 4.5–6.5 arbejdsdage.
