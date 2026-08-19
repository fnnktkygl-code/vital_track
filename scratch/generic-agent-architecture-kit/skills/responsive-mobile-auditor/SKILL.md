---
name: responsive-mobile-auditor
description: Protocole de vérification et d'audit de la réactivité mobile-first, des breakpoints, de la navigation tactile et de l'absence de scroll horizontal non voulu.
---

# 📱 Skill : Responsive & Mobile-First Auditor

## Objectif
Garantir que l'application offre une expérience utilisateur fluide et complète sur tous les formats d'écran : mobile (375px), tablette (768px) et desktop (1024px+).

## Grille de Breakpoints Standardisée

| Nom | Largeur min | Largeur max | Usage |
| :--- | :--- | :--- | :--- |
| **Mobile** | 320px | 767px | Navigation bottom-tab ou hamburger |
| **Tablette** | 768px | 1023px | Grille 2 colonnes, sidebar compressible |
| **Desktop** | 1024px | ∞ | Grille 3+ colonnes, sidebar fixe |

## Checklist d'Audit Mobile

1. **Viewport Meta** : `<meta name="viewport" content="width=device-width, initial-scale=1">` obligatoire.
2. **Scroll Horizontal Interdit** : `overflow-x: hidden` sur `body` ou `html`. Aucun élément ne doit déborder latéralement.
3. **Zones Tactiles Minimales** : Tous les boutons et liens interactifs doivent avoir une taille minimale de `44x44px` (recommandation Apple/Google).
4. **Navigation Mobile** :
   - Barre de navigation fixe en bas (`position: fixed; bottom: 0`) ou menu hamburger.
   - ❌ Pas de sidebar fixe de 250px sur un écran de 375px.
5. **Texte Lisible Sans Zoom** : Taille de police minimale de `14px` pour le corps de texte sur mobile.
6. **Images et Cartes Responsives** : Utiliser `max-width: 100%` et `width: 100%` avec `object-fit: cover`.
7. **Formulaires Accessibles** : Les champs `input` doivent occuper au moins 80% de la largeur de l'écran sur mobile.

## Méthodologie de Test

1. Exécuter le harnais E2E avec viewport mobile :
   ```bash
   node harnesses/run_e2e_audit.mjs --url http://localhost:5173 --viewport 375x812
   ```
2. Vérifier visuellement l'absence de débordement horizontal via `document.documentElement.scrollWidth > window.innerWidth`.
3. Tester la navigation tactile : chaque vue doit être accessible en ≤ 2 taps depuis l'écran d'accueil.
