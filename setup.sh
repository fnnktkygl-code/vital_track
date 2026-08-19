#!/bin/bash

# ══════════════════════════════════════════════════════════════
# 🛡️ Generic Agent Architecture Kit — Installateur Automatique
# 
# Usage (depuis la racine de ton nouveau projet) :
#   bash setup.sh
#
# Ce script :
#   1. Place les règles dans .agents/rules/
#   2. Place les skills dans .agents/skills/
#   3. Place les harnais de test dans harnesses/
#   4. Place les templates dans templates/
#   5. Copie ARCHITECTURE.md et README.md à la racine
#   6. Nettoie derrière lui
# ══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KIT_DIR="$SCRIPT_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🛡️  Installation du Kit d'Architecture Générique pour Agents"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Déterminer le dossier cible (le parent du kit si on est dans le dossier extrait)
if [[ "$(basename "$SCRIPT_DIR")" == "generic-agent-architecture-kit" ]]; then
  TARGET_DIR="$(dirname "$SCRIPT_DIR")"
else
  TARGET_DIR="$SCRIPT_DIR"
fi

echo "📂 Dossier cible : $TARGET_DIR"
echo ""

# 1. Règles
echo "1️⃣  Installation des règles (.agents/rules/)..."
mkdir -p "$TARGET_DIR/.agents/rules"
cp -r "$KIT_DIR/.agents/rules/"*.md "$TARGET_DIR/.agents/rules/" 2>/dev/null && echo "   ✅ 9 règles installées" || echo "   ⚠️ Règles déjà en place"

# 2. Skills
echo "2️⃣  Installation des skills (.agents/skills/)..."
mkdir -p "$TARGET_DIR/.agents/skills"
for skill_dir in "$KIT_DIR/skills/"*/; do
  skill_name="$(basename "$skill_dir")"
  mkdir -p "$TARGET_DIR/.agents/skills/$skill_name"
  cp -r "$skill_dir"* "$TARGET_DIR/.agents/skills/$skill_name/" 2>/dev/null
done
echo "   ✅ 6 skills installées"

# 3. Harnais de test
echo "3️⃣  Installation des harnais de test (harnesses/)..."
mkdir -p "$TARGET_DIR/harnesses"
cp -r "$KIT_DIR/harnesses/"*.mjs "$TARGET_DIR/harnesses/" 2>/dev/null
echo "   ✅ 3 harnais installés"

# 4. Templates
echo "4️⃣  Installation des templates (templates/)..."
cp -r "$KIT_DIR/templates" "$TARGET_DIR/templates" 2>/dev/null || true
echo "   ✅ Templates installés"

# 5. Documentation
echo "5️⃣  Installation de la documentation..."
cp "$KIT_DIR/ARCHITECTURE.md" "$TARGET_DIR/" 2>/dev/null || true
cp "$KIT_DIR/README.md" "$TARGET_DIR/README-kit.md" 2>/dev/null || true
echo "   ✅ ARCHITECTURE.md + README-kit.md"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎉 INSTALLATION TERMINÉE !"
echo ""
echo "   Tu peux maintenant ouvrir ce dossier dans Antigravity"
echo "   et commencer à travailler. Les agents liront"
echo "   automatiquement les 9 règles de .agents/rules/"
echo ""
echo "   Pour lancer les tests :"
echo "   node harnesses/run_e2e_audit.mjs --url http://localhost:5173"
echo "═══════════════════════════════════════════════════════════"
echo ""
