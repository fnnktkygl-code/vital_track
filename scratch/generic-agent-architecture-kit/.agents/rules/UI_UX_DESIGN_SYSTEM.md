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
