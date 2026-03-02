#!/bin/bash
# Design System Compliance Checker
# Runs on PRs to catch common design system violations in changed files.
# Exit code 0 = pass, 1 = violations found.

set -euo pipefail

VIOLATIONS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

log_violation() {
  echo -e "${RED}VIOLATION${NC} [$1:$2] $3"
  VIOLATIONS=$((VIOLATIONS + 1))
}

log_warning() {
  echo -e "${YELLOW}WARNING${NC} [$1:$2] $3"
  WARNINGS=$((WARNINGS + 1))
}

# Get changed files (TSX/JSX/TS/CSS only) — compare against base branch
if [ -n "${GITHUB_BASE_REF:-}" ]; then
  # Running in GitHub Actions PR context
  CHANGED_FILES=$(git diff --name-only "origin/${GITHUB_BASE_REF}...HEAD" -- '*.tsx' '*.jsx' '*.ts' '*.css' 2>/dev/null || echo "")
elif [ -n "${1:-}" ]; then
  # Manual run: pass base branch as argument
  CHANGED_FILES=$(git diff --name-only "${1}...HEAD" -- '*.tsx' '*.jsx' '*.ts' '*.css' 2>/dev/null || echo "")
else
  # Fallback: check all staged + unstaged files
  CHANGED_FILES=$(git diff --name-only HEAD -- '*.tsx' '*.jsx' '*.ts' '*.css' 2>/dev/null || echo "")
  if [ -z "$CHANGED_FILES" ]; then
    # If no diff, check all src files (useful for full repo scan)
    CHANGED_FILES=$(find src -name '*.tsx' -o -name '*.jsx' -o -name '*.ts' -o -name '*.css' 2>/dev/null | grep -v node_modules || echo "")
  fi
fi

if [ -z "$CHANGED_FILES" ]; then
  echo -e "${GREEN}No relevant files changed. Skipping design system check.${NC}"
  exit 0
fi

echo -e "${BOLD}Design System Compliance Check${NC}"
echo "Scanning $(echo "$CHANGED_FILES" | wc -l | tr -d ' ') files..."
echo "---"

for FILE in $CHANGED_FILES; do
  # Skip if file doesn't exist (deleted files)
  [ -f "$FILE" ] || continue

  # Skip non-component files (configs, types-only, etc.)
  case "$FILE" in
    *.config.*|*.d.ts|scripts/*|backend/*) continue ;;
  esac

  LINE_NUM=0
  while IFS= read -r LINE; do
    LINE_NUM=$((LINE_NUM + 1))

    # --- RULE 1: No raw Tailwind color classes (bg-blue-*, text-red-*, etc.) ---
    # Match bg-{color}-{shade} or text-{color}-{shade} but NOT our semantic tokens
    if echo "$LINE" | grep -qE '(bg|text|border|ring)-(red|blue|green|yellow|purple|pink|indigo|teal|cyan|orange|lime|emerald|violet|fuchsia|rose|sky|amber|stone|zinc|slate|gray)-[0-9]+' 2>/dev/null; then
      # Exclude comments and string literals used for documentation
      if ! echo "$LINE" | grep -qE '^\s*(//|/?\*|\*)' 2>/dev/null; then
        log_violation "$FILE" "$LINE_NUM" "Raw Tailwind color class detected. Use semantic tokens (main-*, accent-*, success-*, etc.) or CSS variables instead."
      fi
    fi

    # --- RULE 2: Forbidden color shades (200, 400, 600, 800) for semantic colors ---
    if echo "$LINE" | grep -qE '(main|accent-[0-9]+|success|alert|error|info)-(200|400|600|800)' 2>/dev/null; then
      if ! echo "$LINE" | grep -qE '^\s*(//|/?\*|\*)' 2>/dev/null; then
        log_violation "$FILE" "$LINE_NUM" "Forbidden shade detected. Only use shades: 50, 100, 300, 500, 700, 900, 950 for semantic colors."
      fi
    fi

    # --- RULE 3: Hardcoded hex colors in className or style props ---
    # Match hex colors in JSX style objects or inline
    if echo "$LINE" | grep -qE "(color|background|border).*['\"]#[0-9a-fA-F]{3,8}['\"]" 2>/dev/null; then
      # Allow in CSS variable definitions (globals.css defines them)
      if [[ "$FILE" != *"globals.css"* ]] && ! echo "$LINE" | grep -qE '^\s*(//|/?\*|\*|--[a-z])' 2>/dev/null; then
        log_warning "$FILE" "$LINE_NUM" "Hardcoded hex color found. Prefer CSS variables (var(--surface-base), var(--text-primary), etc.)."
      fi
    fi

    # --- RULE 4: Pure black backgrounds ---
    if echo "$LINE" | grep -qE "(background|bg).*#000000|bg-black" 2>/dev/null; then
      if ! echo "$LINE" | grep -qE '^\s*(//|/?\*|\*)' 2>/dev/null; then
        log_violation "$FILE" "$LINE_NUM" "Pure black (#000000/bg-black) is forbidden. Use var(--surface-base) for dark mode backgrounds."
      fi
    fi

    # --- RULE 5: Unreliable Tailwind bg/text classes for neutrals ---
    if echo "$LINE" | grep -qE 'className=.*\b(bg-neutral-[0-9]+|bg-gray-[0-9]+|text-neutral-[0-9]+|text-gray-[0-9]+)\b' 2>/dev/null; then
      if ! echo "$LINE" | grep -qE '^\s*(//|/?\*|\*)' 2>/dev/null; then
        log_warning "$FILE" "$LINE_NUM" "Tailwind neutral/gray classes may not work reliably. Use CSS classes (light-gray-bg) or CSS variables instead."
      fi
    fi

    # --- RULE 6: Missing dark mode consideration (inline styles with colors) ---
    if echo "$LINE" | grep -qE "style=\{.*color:" 2>/dev/null; then
      if ! echo "$LINE" | grep -qE 'var\(--' 2>/dev/null; then
        log_warning "$FILE" "$LINE_NUM" "Inline style with color detected. Ensure dark mode compatibility — use CSS variables (var(--text-primary)) instead."
      fi
    fi

  done < "$FILE"
done

echo "---"
echo -e "${BOLD}Results:${NC}"
echo -e "  Violations: ${RED}${VIOLATIONS}${NC}"
echo -e "  Warnings:   ${YELLOW}${WARNINGS}${NC}"

if [ "$VIOLATIONS" -gt 0 ]; then
  echo ""
  echo -e "${RED}${BOLD}FAILED${NC} — $VIOLATIONS violation(s) must be fixed before merging."
  echo ""
  echo "Reference: See CLAUDE.md and .claude/skills/dashboard-builder/SKILL.md for design system rules."
  exit 1
else
  if [ "$WARNINGS" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}PASSED with warnings${NC} — Please review the warnings above."
  else
    echo ""
    echo -e "${GREEN}${BOLD}PASSED${NC} — No design system violations found."
  fi
  exit 0
fi
