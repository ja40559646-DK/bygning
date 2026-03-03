# Sikkerhedsbaseline v1 (Fase 0.3)

## Formål
Etablere minimumskrav for sikker udvikling og drift, før funktionel udvikling fortsætter.

## 1) Trusselsmodel v1 (scope)
Kerneaktiver:
- Kunde- og projektdata (PII).
- Tegningsdata/geometri.
- Beregningsinput/outputs og revisionsspor.
- Login/sessiondata.

Primære trusler:
- Uautoriseret adgang til projektdata.
- Læk af hemmeligheder (tokens/API keys).
- Manipulation af beregningsinput eller resultater.
- Manglende sporbarhed ved ændringer.

Kontroller:
- Stærk autentificering (OTP/email flow planlagt i senere fase).
- Rollebaseret adgangsstyring (planlagt).
- Audit-log for kritiske operationer.
- Secrets kun via miljøvariabler/secrets manager.

## 2) Hemmelighedshåndtering
- Ingen tokens, passwords eller nøgler i kildekode.
- `.env` må kun bruges lokalt og må aldrig committes.
- Brug `.env.example` som skabelon uden hemmeligheder.
- Kør `npm run security` før commit.

## 3) Audit-log strategi (minimum)
Følgende hændelser skal logges i senere API-implementering:
- Loginforsøg og verifikation.
- Oprettelse/opdatering/sletning af projektdata.
- Ændringer i materiale- og beregningsinput.

Krav til audit-log:
- UTC timestamp.
- Actor ID (bruger/system).
- Action type.
- Entity type + entity ID.
- Resultat (success/fail).

## 4) Backup/restore plan v1
- Daglig backup af database.
- Minimum 14 dages retention.
- Gendannelsestest mindst månedligt.
- Restore-RTO mål: < 4 timer (foreløbigt mål, valideres senere).

## 5) Gate-krav for Fase 0.3
- Ingen hardcodede credentials i repo (verificeres af security script).
- Baseline-dokumentation godkendt.
- CI kører security-check sammen med lint/test.
