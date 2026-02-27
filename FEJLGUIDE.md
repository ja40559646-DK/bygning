# Fejlguidelines

Her er en kort guide til almindelige fejl, når du arbejder med GitHub i dette repository.

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

## 60-sekunders tjek (hurtig version)
- [ ] GitHub Desktop er installeret
- [ ] Repo `bygning` er åbnet i GitHub Desktop
- [ ] Remote URL matcher `ja40559646-DK/bygning.git`
- [ ] Commit lavet
- [ ] Push origin lykkedes

Når du har gjort dette, er adgangen sat korrekt, og jeg kan arbejde videre uden stop.