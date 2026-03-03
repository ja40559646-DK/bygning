# Beregningsgovernance v1 (Fase 0.4)

## Formål
Sikre at alle beregninger i systemet er sporbare, versionsstyrede og verificerbare mod dokumenterede kilder.

## 1) Kildeformat for formler
Hver formel registreres med følgende metadata:
- `formula_id`: unik nøgle (fx `EC1-SNOW-001`)
- `name`: kort navn
- `domain`: fx last, geometri, kombination
- `equation`: matematisk udtryk
- `units_in`: enheder på input
- `units_out`: enheder på output
- `source_standard`: fx DS/EN/NA/BR18-reference
- `source_clause`: paragraf/afsnit i kilden
- `assumptions`: antagelser og begrænsninger
- `valid_ranges`: gyldige inputintervaller

## 2) Versionsprincip for calculation-engine
- SemVer anvendes: `MAJOR.MINOR.PATCH`
- `PATCH`: fejlrettelse uden ændret beregningsmetode
- `MINOR`: ny formel/udvidelse bagudkompatibelt
- `MAJOR`: breaking changes i resultater eller API

Krav:
- Hver release skal have changelog med påvirkede `formula_id`.
- Referencecases køres ved hver release.

## 3) Referencecase-template (minimum)
Hver case skal indeholde:
- Case ID og titel
- Inputdata med enheder
- Formel-ID(er)
- Manuel forventet beregning
- Forventet output og tolerance
- Godkender + dato

Se skabelon: `templates/reference-case-template.md`.

## 4) Verifikationskrav
- Alle nye/ændrede formler skal have mindst 1 referencecase.
- Regressionstests må ikke forringes.
- Ved uenighed mellem kilde og implementering stoppes release.
