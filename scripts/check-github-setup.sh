#!/usr/bin/env bash
set -euo pipefail

ok() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }
fail() { echo "❌ $1"; exit 1; }

LOCAL_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --local-only)
      LOCAL_ONLY=true
      ;;
    -h|--help)
      echo "Brug: bash scripts/check-github-setup.sh [--local-only]"
      echo "  --local-only  Spring remote/auth checks over (lokal udvikling)."
      exit 0
      ;;
    *)
      fail "Ukendt argument: $arg"
      ;;
  esac
done

if $LOCAL_ONLY; then
  echo "ℹ️  Kører i local-only mode (ingen remote/auth krav)."
fi

# 1) repo check
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "Git repository fundet"
else
  fail "Ikke i et git repository"
fi

# 2) branch check
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ -n "${branch}" && "${branch}" != "HEAD" ]]; then
  ok "Aktiv branch: ${branch}"
else
  warn "Ingen normal branch fundet (detached HEAD?)"
fi

# 3) identity check
name="$(git config --get user.name || true)"
email="$(git config --get user.email || true)"
if [[ -n "${name}" ]]; then
  ok "git user.name er sat (${name})"
else
  warn "git user.name mangler"
fi

if [[ -n "${email}" ]]; then
  ok "git user.email er sat (${email})"
else
  warn "git user.email mangler"
fi

if $LOCAL_ONLY; then
  echo
  echo "Kontrol færdig (local-only). Lokal udvikling kan fortsætte uden remote."
  exit 0
fi

# 4) origin check
origin_url="$(git remote get-url origin 2>/dev/null || true)"
if [[ -z "${origin_url}" ]]; then
  warn "origin remote mangler"
  echo "   Kør: git remote add origin https://github.com/ja40559646-DK/bygning.git"
  echo "   Eller kør local-only: bash scripts/check-github-setup.sh --local-only"
else
  ok "origin remote fundet: ${origin_url}"
  if [[ "${origin_url}" == "https://github.com/ja40559646-DK/bygning.git" || "${origin_url}" == "git@github.com:ja40559646-DK/bygning.git" ]]; then
    ok "origin matcher forventet repository"
  else
    warn "origin matcher ikke forventet repo"
    echo "   Forventet: https://github.com/ja40559646-DK/bygning.git"
  fi
fi

# 5) network reachability (non-fatal)
if command -v git >/dev/null 2>&1; then
  if [[ -n "${origin_url}" ]] && git ls-remote --heads origin >/dev/null 2>&1; then
    ok "Fjernrepo er nåbart (ls-remote lykkedes)"
  else
    warn "Kunne ikke kontakte origin (eller manglende auth)."
    echo "   Dette kan være normalt før token/login er sat op."
  fi
fi

echo
echo "Kontrol færdig. Hvis der kun er ✅ er opsætningen klar til uhindret fremdrift."
