---
name: ui-ux-accessibility-auditor
description: Protocole d'évaluation de la conformité design system, des ratios de contraste WCAG AA/AAA, de l'accessibilité clavier et de la réactivité des boutons.
---

# 🎨 Skill : UI/UX & Accessibility Auditor

## Grille d'Évaluation
1. **Ratios de Contraste** :
   - Texte normal : Contraste minimal de `4.5:1` (WCAG AA) ou `7:1` (WCAG AAA).
   - Titres et texte agrandi : Contraste minimal de `3:1`.
2. **Cohérence Visuelle & Sémantique** :
   - Vert pour validation / actions positives.
   - Ambre pour avertissement / modération.
   - Rouge pour erreurs / actions destructrices.
   - Cyan / Bleu pour information / hydratation / navigation.
3. **États Interactifs** :
   - Tester le survol (`:hover`), l'enfoncement (`:active`), la navigation tabulation (`:focus-visible`) et l'état désactivé (`:disabled`).
4. **Modales & Accessibilité** :
   - Piégeage du focus dans les modales ouvertes.
   - Écoute de la touche `Escape` pour fermeture immédiate.
