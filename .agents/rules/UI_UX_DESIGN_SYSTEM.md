# 🎨 Charte UI/UX, Design System & Accessibilité (UI_UX_DESIGN_SYSTEM.md)

---

## 1. Palette de Couleurs Sémantique Universelle

| Rôle Sémantique | Token CSS | Valeur Dark Mode | Valeur Light Mode | Usage Autorisé |
| :--- | :--- | :--- | :--- | :--- |
| **Fond Principal** | `--bg` | `#111827` | `#f8fafc` | Fond d'écran global |
| **Cartes & Surfaces** | `--bg-card` | `rgba(255,255,255,0.04)` | `#ffffff` | Cartes, conteneurs, modales |
| **Succès / Vitalité** | `--accent` / `--color-success` | `#10b981` / `#34d399` | `#059669` | Succès, validé, alcalin, électrique |
| **Avertissement** | `--color-warning` | `#f59e0b` / `#fbbf24` | `#d97706` | Alerte modérée, hybride, vigilance |
| **Danger / Acidose** | `--color-danger` | `#ef4444` / `#f87171` | `#dc2626` | Erreur, acidifiant, action destructrice |
| **Information** | `--color-info` | `#38bdf8` / `#22d3ee` | `#0284c7` | Liens, hydratation, badges neutres |
| **Texte Principal** | `--text` | `#f3f4f6` | `#0f172a` | Titres, corps de texte (Contraste > 12:1) |
| **Texte Secondaire** | `--text-dim` | `#9ca3af` | `#64748b` | Sous-titres, métadonnées, dates |

---

## 2. États des Boutons & Composants Interactifs

Chaque bouton doit obligatoirement avoir des styles distincts pour :
1. **État Normal (`:default`)** : Contraste net, bordure subtile, typographie lisible.
2. **Survol (`:hover`)** : Translation douce (`transform: translateY(-1px)`), lueur d'accentuation (`box-shadow: 0 4px 14px ...`).
3. **Pression (`:active`)** : Enfoncement tactile (`transform: translateY(1px)`).
4. **Focus Clavier (`:focus-visible`)** : Contour visible (`outline: 2px solid var(--accent); outline-offset: 2px`).
5. **Désactivé (`:disabled`)** : Opacité réduite à `0.4`, curseur `not-allowed`, zéro effet au survol.

---

## 3. Logique de Notifications & Modales de Confirmation

1. **Toasts Éphémères** :
   - Affichage en bas ou en haut de l'écran, non bloquant pour la navigation.
   - Durée d'affichage standardisée : **3 500 ms**.
   - Icône sémantique obligatoire (ex: `✅`, `⚠️`, `❌`, `ℹ️`).
2. **Modales de Confirmation (`showConfirmModal`)** :
   - Obligatoire pour toute action irréversible (suppression, réinitialisation de compte, purge de cache).
   - Bouton de confirmation en rouge/danger, bouton d'annulation neutre mis en avant par défaut.
   - Fermeture possible via touche `Echap` ou clic sur le backdrop.

---

## 4. Règle Stricte sur les Infobulles / Tooltips (Anti-Clipping & Bords d'écran)

1. **Interdiction Formelle des Tooltips en pseudo-éléments `::after` / `::before` sur des conteneurs `overflow: hidden`** :
   - Un pseudo-élément tooltip `[data-tooltip]::after` placé à l'intérieur d'une carte avec `overflow: hidden` ou `border-radius` se fait SYSTÉMATIQUEMENT couper par le bord du conteneur.
2. **Utilisation Obligatoire du Moteur Flottant Rattaché au `document.body` (`#vitalGlobalTooltip`)** :
   - Tous les tooltips doivent être calculés dynamiquement via `getBoundingClientRect()` et positionnés en `position: fixed` directement sur `document.body` avec `z-index: 999999`.
3. **Clamping & Détection des Bords d'Écran Obligatoire** :
   - Tout tooltip doit être protégé contre le dépassement à droite (`window.innerWidth - width - 12px`), à gauche (`> 12px`), et au-dessus de l'écran (bascule automatique en-dessous si l'élément est trop haut).

