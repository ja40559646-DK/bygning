# GitHub opsætning (meget nem version – uden teknisk sprog)

Du har allerede lavet token ✅
Nu mangler vi kun at koble din computer til repoet.

Jeg giver dig 2 metoder:
- **Metode A (ANBEFALET): GitHub Desktop (ingen terminal, ingen bash).**
- Metode B: Terminal (kun hvis du vil).

---

## Vigtigt svar på dit spørgsmål
Ja, vi kan godt arbejde **uden remote** i en periode.
- Uden remote kan vi stadig udvikle, committe og teste lokalt.
- Uden remote kan vi **ikke** pushe til GitHub eller lave PR fra din maskine.

Hvis du kun vil tjekke lokal opsætning uden advarsler om `origin`, så kør:
```bash
bash scripts/check-github-setup.sh --local-only  # eller uden flag for fuld remote-check
```

---

## Metode A (anbefalet) – GitHub Desktop (ingen “bash”)

## Trin 1: Installer GitHub Desktop
1. Gå til: https://desktop.github.com/
2. Klik **Download for Windows** (eller Mac).
3. Installer programmet.
4. Log ind med din GitHub-konto.

## Trin 2: Åbn dit repo i GitHub Desktop
1. I GitHub Desktop: klik **File** -> **Add local repository...**
2. Vælg mappen `bygning` på din computer.
3. Klik **Add Repository**.

## Trin 3: Sæt remote korrekt
1. Klik **Repository** -> **Repository settings**.
2. Under **Remote** skal URL være:
   `https://github.com/ja40559646-DK/bygning.git`
3. Hvis den er forkert, ret den og gem.

## Trin 4: Test forbindelse med en push
1. Lav en lille ændring (fx i en tekstfil).
2. Nederst venstre: skriv commit-besked, fx `test github forbindelse`.
3. Klik **Commit to <branch>**.
4. Klik **Push origin** øverst.

Når GitHub beder om login:
- Brugernavn = dit GitHub-brugernavn
- Password = din **token** (PAT), ikke din normale adgangskode

Hvis push lykkes: færdig ✅

---

## Metode B – Terminal (kun hvis du vil)

> “bash” betyder bare: skriv linjen i terminalen og tryk Enter.

### Hvor skriver man det?
- **Windows:** Åbn "Git Bash" eller "PowerShell"
- **Mac:** Åbn "Terminal"

Gå til projektmappen først (eksempel):
```bash
cd sti/til/bygning
```

Kør derefter disse 4 linjer én ad gangen:
```bash
git remote set-url origin https://github.com/ja40559646-DK/bygning.git 2>/dev/null || git remote add origin https://github.com/ja40559646-DK/bygning.git
git config user.name "DIT NAVN"
git config user.email "DIN_GITHUB_MAIL@EKSEMPEL.DK"
bash scripts/check-github-setup.sh --local-only  # eller uden flag for fuld remote-check
```

Til sidst test push:
```bash
git commit --allow-empty -m "chore: verify github access"
git push -u origin HEAD
```

---

## Fejlguide i almindeligt dansk

## Fejl 1: “Permission denied” / 401 / 403
Det betyder næsten altid token-problem.
- Tjek at token har `Contents: Read and write`
- Tjek at token ikke er udløbet
- Brug token som password (ikke normal GitHub-kode)

## Fejl 2: “remote origin already exists”
Det er ikke farligt. Kør bare:
```bash
git remote set-url origin https://github.com/ja40559646-DK/bygning.git
```

## Fejl 3: “jeg ved ikke hvad terminal er”
Brug **Metode A (GitHub Desktop)**. Den er lavet til præcis dette.

---


## Fejl 4: “der er ingen work eller origin/work”
Det er helt OK. Så bruger du bare `main`.

Kør dette:
```bash
cd /workspaces/bygning
git checkout main
git pull origin main
bash scripts/check-github-setup.sh --local-only  # hvis scriptet findes i din branch
```

Hvis `scripts/check-github-setup.sh` ikke findes i din `main`, er det fordi filen ikke er merged til `main` endnu.
Så kan du stadig arbejde videre med:
```bash
git status
git add .
git commit -m "din besked"
git push origin main
```

Når vi har merged projektfilerne til `main`, vil scriptet også findes der.

---


## Metode C – Fuld download/import (bundle-fil)
Hvis du vil tage hele projektet med historik som en fil og importere det i GitHub:

```bash
bash scripts/create-github-import-bundle.sh
```

Det genererer en `.bundle`-fil i `export/`. Importen er:

```bash
mkdir import-bygning && cd import-bygning
git clone ../bygning/export/<filnavn>.bundle bygning
cd bygning
git remote add origin https://github.com/<din-bruger>/<repo>.git
git push -u origin --all
git push origin --tags
```

Tip: brug filen `*.manifest.txt` i `export/` som huskeseddel.

## 60-sekunders tjek (hurtig version)
- [ ] GitHub Desktop er installeret
- [ ] Repo `bygning` er åbnet i GitHub Desktop
- [ ] Remote URL matcher `ja40559646-DK/bygning.git`
- [ ] Commit lavet
- [ ] Push origin lykkedes

Når du har gjort dette, er adgangen sat korrekt, og jeg kan arbejde videre uden stop.
