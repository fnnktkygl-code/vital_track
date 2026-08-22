/**
 * refactor_index_html_i18n.mjs
 * 
 * Applique systématiquement les attributs data-i18n, data-i18n-title,
 * data-i18n-placeholder et data-i18n-aria sur tous les éléments de index.html.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, '../web-app/index.html');

let html = fs.readFileSync(indexPath, 'utf8');

const replacements = [
  // Desktop Topbar
  {
    target: '<span class="status-title">VitalTrack Coach Pro</span>',
    replace: '<span class="status-title" data-i18n="header.coachProBadge">VitalTrack Coach Pro</span>'
  },
  {
    target: 'title="Changer de langue">',
    replace: 'title="Changer de langue" data-i18n-title="header.langToggleTitle">'
  },
  {
    target: 'title="Mode sombre/clair">',
    replace: 'title="Mode sombre/clair" data-i18n-title="header.themeToggleTitle">'
  },
  {
    target: 'title="Site Vitrine & Vidéos Démo"',
    replace: 'title="Site Vitrine & Vidéos Démo" data-i18n-title="header.landingTitle"'
  },
  {
    target: 'title="Paramètres & RGPD"',
    replace: 'title="Paramètres & RGPD" data-i18n-title="header.settingsTitle"'
  },

  // More Drawer Header & Cards
  {
    target: '<h3 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--text);">Plus de Fonctionnalités</h3>',
    replace: '<h3 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--text);" data-i18n="drawer.title">Plus de Fonctionnalités</h3>'
  },
  {
    target: '<p style="margin:2px 0 0 0; font-size:0.76rem; color:var(--text-dim);">Toutes les ressources &amp; outils de l\'écosystème</p>',
    replace: '<p style="margin:2px 0 0 0; font-size:0.76rem; color:var(--text-dim);" data-i18n="drawer.subtitle">Toutes les ressources &amp; outils de l\'écosystème</p>'
  },
  {
    target: '<button class="more-drawer-close" onclick="window.toggleMoreDrawer(false)" aria-label="Fermer">',
    replace: '<button class="more-drawer-close" onclick="window.toggleMoreDrawer(false)" aria-label="Fermer" data-i18n-aria="drawer.closeAria">'
  },
  {
    target: '<strong>Bilan Deep Search (0 €)</strong>\n          <span>Diagnostic holistique &amp; 5 émonctoires</span>',
    replace: '<strong data-i18n="drawer.deepSearch">Bilan Deep Search (0 €)</strong>\n          <span data-i18n="drawer.deepSearchSub">Diagnostic holistique &amp; 5 émonctoires</span>'
  },
  {
    target: '<strong>Recettes &amp; Pharmacopée</strong>\n          <span>Sebi, Ehret, Morse, Kallas &amp; Christopher</span>',
    replace: '<strong data-i18n="drawer.recipes">Recettes &amp; Pharmacopée</strong>\n          <span data-i18n="drawer.recipesSub">Sebi, Ehret, Morse, Kallas &amp; Christopher</span>'
  },
  {
    target: '<strong>Médias &amp; Vidéos</strong>\n          <span>Wim Hof, masterclass &amp; PDF</span>',
    replace: '<strong data-i18n="drawer.resources">Médias &amp; Vidéos</strong>\n          <span data-i18n="drawer.resourcesSub">Wim Hof, masterclass &amp; PDF</span>'
  },
  {
    target: '<strong>Pharmacopée Raintree</strong>\n          <span>Monographies &amp; remèdes amazoniens</span>',
    replace: '<strong data-i18n="drawer.materia">Pharmacopée Raintree</strong>\n          <span data-i18n="drawer.materiaSub">Monographies &amp; remèdes amazoniens</span>'
  },
  {
    target: '<strong>Respiration Wim Hof</strong>\n          <span>Orbe interactif &amp; minuteur guidé</span>',
    replace: '<strong data-i18n="drawer.breathing">Respiration Wim Hof</strong>\n          <span data-i18n="drawer.breathingSub">Orbe interactif &amp; minuteur guidé</span>'
  },
  {
    target: '<strong>Recherche Aliments &amp; PRAL</strong>\n          <span>Dr. Sebi, Ehret, Morse &amp; analyse</span>',
    replace: '<strong data-i18n="drawer.search">Recherche Aliments &amp; PRAL</strong>\n          <span data-i18n="drawer.searchSub">Dr. Sebi, Ehret, Morse &amp; analyse</span>'
  },
  {
    target: '<strong>Journal des Repas</strong>\n          <span>Suivi acido-basique journalier</span>',
    replace: '<strong data-i18n="drawer.meals">Journal des Repas</strong>\n          <span data-i18n="drawer.mealsSub">Suivi acido-basique journalier</span>'
  },
  {
    target: '<strong>Mes Favoris</strong>\n          <span>Aliments &amp; remèdes sauvegardés</span>',
    replace: '<strong data-i18n="drawer.favorites">Mes Favoris</strong>\n          <span data-i18n="drawer.favoritesSub">Aliments &amp; remèdes sauvegardés</span>'
  },
  {
    target: '<strong>Protocoles &amp; Paramètres</strong>\n          <span>Bio-Profil, RGPD &amp; sécurité</span>',
    replace: '<strong data-i18n="drawer.settings">Protocoles &amp; Paramètres</strong>\n          <span data-i18n="drawer.settingsSub">Bio-Profil, RGPD &amp; sécurité</span>'
  },
  {
    target: '<strong>Studio Mascotte Vital</strong>\n          <span>Personnalisation &amp; humeurs</span>',
    replace: '<strong data-i18n="drawer.studio">Studio Mascotte Vital</strong>\n          <span data-i18n="drawer.studioSub">Personnalisation &amp; humeurs</span>'
  },

  // Weight Section
  {
    target: '<span class="weight-kpi-label">Poids Actuel</span>',
    replace: '<span class="weight-kpi-label" data-i18n="dashboard.kpiCurrentWeight">Poids Actuel</span>'
  },
  {
    target: '<span class="weight-kpi-label">Variation Totale</span>',
    replace: '<span class="weight-kpi-label" data-i18n="dashboard.kpiTotalDelta">Variation Totale</span>'
  },
  {
    target: '<span class="weight-kpi-label">Moyenne 7 Jours</span>',
    replace: '<span class="weight-kpi-label" data-i18n="dashboard.kpiAvg7d">Moyenne 7 Jours</span>'
  },
  {
    target: '<span class="weight-kpi-label">Poids Cible</span>',
    replace: '<span class="weight-kpi-label" data-i18n="dashboard.kpiTargetWeight">Poids Cible</span>'
  },
  {
    target: '<button class="weight-period-btn" data-period="7d">7j</button>',
    replace: '<button class="weight-period-btn" data-period="7d" data-i18n="dashboard.period7d">7 Jours</button>'
  },
  {
    target: '<button class="weight-period-btn active" data-period="30d">30j</button>',
    replace: '<button class="weight-period-btn active" data-period="30d" data-i18n="dashboard.period30d">30 Jours</button>'
  },
  {
    target: '<button class="weight-period-btn" data-period="90d">90j</button>',
    replace: '<button class="weight-period-btn" data-period="90d" data-i18n="dashboard.period90d">90 Jours</button>'
  },
  {
    target: '<button class="weight-period-btn" data-period="all">Tout</button>',
    replace: '<button class="weight-period-btn" data-period="all" data-i18n="dashboard.periodAll">Tout</button>'
  },

  // Water Card
  {
    target: '<span data-i18n="waterCardTitle">Hydratation Cellulaire & Eau Structurée</span>',
    replace: '<span data-i18n="dashboard.waterCardTitle">Hydratation Cellulaire & Eau Structurée</span>'
  },
  {
    target: '<div class="water-progress-text" id="waterProgressText">Objectif : 2.5 L d\'eau vivante</div>',
    replace: '<div class="water-progress-text" id="waterProgressText" data-i18n="dashboard.waterTarget">Objectif : 2.5 L d\'eau vivante</div>'
  },

  // Quick Action Buttons
  {
    target: '<span class="quick-action-text">Lancer un Bilan Deep Search</span>',
    replace: '<span class="quick-action-text" data-i18n="dashboard.startDeepSearchBtn">Lancer un Bilan Deep Search</span>'
  },
  {
    target: '<span class="quick-action-text">Explorer les 76 Recettes</span>',
    replace: '<span class="quick-action-text" data-i18n="dashboard.browseRecipesBtn">Explorer les 76 Recettes</span>'
  },
  {
    target: '<span class="quick-action-text">Ouvrir la Liseuse e-Book</span>',
    replace: '<span class="quick-action-text" data-i18n="dashboard.openReaderBtn">Ouvrir la Liseuse e-Book</span>'
  },
  {
    target: '<span class="quick-action-text">Lancer le Minuteur de Jeûne</span>',
    replace: '<span class="quick-action-text" data-i18n="dashboard.fastingTimerBtn">Lancer le Minuteur de Jeûne</span>'
  }
];

let count = 0;
for (const r of replacements) {
  if (html.includes(r.target)) {
    html = html.replace(r.target, r.replace);
    count++;
  }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log(`✅ ${count} remplacements appliqués avec succès dans index.html !`);
