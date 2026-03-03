# Fase 1 backlog – kundeoplysninger, projekt og adgang (1.1–1.9)

## Step 1.1–1.9 (færdiggjort)
- [x] **1.1** Domænevalidering for kunde/projekt intake-data.
- [x] **1.2** Understøttelse af "projektadresse = kundeadresse" + normalisering af input.
- [x] **1.3** Persistensmodel v1 (in-memory repositories for projekt og OTP).
- [x] **1.4** Service-lag til oprettelse af intake med entydigt projekt-ID.
- [x] **1.5** OTP-generering, udløbshåndtering og forbrug af kode.
- [x] **1.6** Mail-adapter (in-memory + console) for OTP-notifikation.
- [x] **1.7** Verifikationsflow der udsteder sessions-token ved gyldig OTP.
- [x] **1.8** API handlers + HTTP server for health, intake, request-code og verify.
- [x] **1.9** Unit tests for domæne- og API-flow.

## Leverede endpoints (v1)
- `GET /health`
- `POST /api/intake`
- `POST /api/auth/request-code`
- `POST /api/auth/verify`

## Næste steps (Fase 1.x)
- [ ] Erstat in-memory persistens med database.
- [ ] Reelt mail-provider setup (SMTP/API) i stedet for console/in-memory.
- [ ] Rate limiting + lockout på OTP endpoints.
- [ ] Audit-log persistens for auth-hændelser.
