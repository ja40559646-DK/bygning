# Branch-strategi (Fase 0.2)

## Formål
Sikre stabil leverance med små, reviewbare ændringer og klare merge-regler.

## Regler
- `main` er beskyttet og deploybar.
- Alt arbejde laves i feature branches:
  - `feature/<kort-beskrivelse>`
  - `fix/<kort-beskrivelse>`
  - `chore/<kort-beskrivelse>`
- Direkte push til `main` er ikke tilladt.

## PR-krav
- Min. 1 review.
- CI skal være grøn (lint + test).
- Ingen åbne kritiske kommentarer.

## Merge
- Squash merge anbefales for ren historik.
- PR-titel skal beskrive leverancen tydeligt.

## Hotfix
- `hotfix/<kort-beskrivelse>` fra `main` ved kritiske fejl.
- Efter merge skal evt. afledte branches opdateres.
