/**
 * recipesModule.js
 * 
 * Module interactif de Pharmacopée Culinaire & Recettes Éprouvées.
 * Design épuré inspiré de l'esthétique Apple (Light & Dark theme),
 * recherche multi-ingrédients, filtrage par auteur & tradition,
 * calculateur dynamique de portions et fiches cliniques détaillées.
 * Totalement internationalisé via le moteur i18n (FR, EN, ES, FR-CA).
 */

import { VITALIST_RECIPES, RECIPE_AUTHORS, RECIPE_TAGS } from './data/recipesData.js';
import { 
  getLocalizedRecipe, 
  getLocalizedPopularIngredients, 
  getLocalizedTraditionFilters, 
  getLocalizedAuthorConfig 
} from './data/recipesI18n.js';
import { t, getLanguage } from './i18n.js';
import './styles/recipesPagination.css';
import './styles/recipesAppleStyle.css';
import './styles/materiaAppleStyle.css';

let _recipeSearchQuery = '';
let _selectedAuthor = 'all';
let _selectedTag = 'all';
let _selectedIngredients = new Set();
let _ingredientMatchMode = 'ANY';
let _activeModalRecipe = null;
let _currentModalServings = 4;
let _currentRecipePage = 1;
let _recipesPerPage = 12;

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function initRecipesModule() {
  window.renderRecipesView = renderRecipesView;
  window.setRecipeSearchQuery = setRecipeSearchQuery;
  window.setRecipeAuthorFilter = setRecipeAuthorFilter;
  window.setRecipeTagFilter = setRecipeTagFilter;
  window.toggleRecipeIngredientFilter = toggleRecipeIngredientFilter;
  window.setIngredientMatchMode = setIngredientMatchMode;
  window.clearAllRecipeFilters = clearAllRecipeFilters;
  window.setRecipePage = setRecipePage;
  window.setRecipesPerPage = setRecipesPerPage;
  window.openRecipeModal = openRecipeModal;
  window.closeRecipeModal = closeRecipeModal;
  window.setRecipeModalServings = setRecipeModalServings;
  window.copyRecipeToClipboard = copyRecipeToClipboard;
  window.addRecipeToFavorites = addRecipeToFavorites;
}

export function setRecipeSearchQuery(query) {
  _recipeSearchQuery = query.trim();
  _currentRecipePage = 1;
  renderRecipesView();
}

export function setRecipeAuthorFilter(author) {
  _selectedAuthor = author;
  _currentRecipePage = 1;
  renderRecipesView();
}

export function setRecipeTagFilter(tag) {
  _selectedTag = tag;
  _currentRecipePage = 1;
  renderRecipesView();
}

export function toggleRecipeIngredientFilter(ing) {
  if (_selectedIngredients.has(ing)) {
    _selectedIngredients.delete(ing);
  } else {
    _selectedIngredients.add(ing);
  }
  _currentRecipePage = 1;
  renderRecipesView();
}

export function setIngredientMatchMode(mode) {
  _ingredientMatchMode = mode;
  _currentRecipePage = 1;
  renderRecipesView();
}

export function clearAllRecipeFilters() {
  _recipeSearchQuery = '';
  _selectedAuthor = 'all';
  _selectedTag = 'all';
  _selectedIngredients.clear();
  _currentRecipePage = 1;
  const searchInput = document.getElementById('recipeSearchInput');
  if (searchInput) searchInput.value = '';
  renderRecipesView();
}

export function setRecipePage(page) {
  const filtered = getFilteredRecipes();
  const totalPages = Math.max(1, Math.ceil(filtered.length / _recipesPerPage));
  _currentRecipePage = Math.max(1, Math.min(page, totalPages));
  renderRecipesView();

  const anchor = document.getElementById('recipesGridAnchor') || document.getElementById('recipesContainer');
  if (anchor) {
    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function setRecipesPerPage(limit) {
  _recipesPerPage = limit === 'all' ? 999999 : (parseInt(limit, 10) || 12);
  _currentRecipePage = 1;
  renderRecipesView();
}

/**
 * Filtre les recettes selon tous les critères combinés
 */
function getFilteredRecipes() {
  const q = _recipeSearchQuery.toLowerCase();
  const selectedIngArray = Array.from(_selectedIngredients).map(i => i.toLowerCase());

  return VITALIST_RECIPES.filter(recipe => {
    // 1. Filtre par auteur
    if (_selectedAuthor !== 'all' && recipe.author !== _selectedAuthor) {
      return false;
    }

    // 2. Filtre par tag
    if (_selectedTag !== 'all') {
      const matchTag = recipe.tags.some(t => t.toLowerCase().includes(_selectedTag.toLowerCase())) ||
        (recipe.category && recipe.category.toLowerCase().includes(_selectedTag.toLowerCase()));
      if (!matchTag) return false;
    }

    // 3. Filtre textuel général
    if (q) {
      const matchTitle = recipe.title.toLowerCase().includes(q);
      const matchSubtitle = recipe.subtitle.toLowerCase().includes(q);
      const matchAuthor = recipe.author.toLowerCase().includes(q);
      const matchDesc = recipe.description.toLowerCase().includes(q);
      const matchVitalist = recipe.vitalistAction.toLowerCase().includes(q);
      const matchIng = recipe.ingredients.some(i => i.name.toLowerCase().includes(q));

      if (!matchTitle && !matchSubtitle && !matchAuthor && !matchDesc && !matchVitalist && !matchIng) {
        return false;
      }
    }

    // 4. Filtre multi-ingrédients
    if (selectedIngArray.length > 0) {
      const recipeIngredientsText = recipe.ingredients.map(i => i.name.toLowerCase()).join(' ');
      
      if (_ingredientMatchMode === 'ALL') {
        const allPresent = selectedIngArray.every(ing => recipeIngredientsText.includes(ing));
        if (!allPresent) return false;
      } else {
        const anyPresent = selectedIngArray.some(ing => recipeIngredientsText.includes(ing));
        if (!anyPresent) return false;
      }
    }

    return true;
  });
}

/**
 * Calcule le nombre d'ingrédients correspondants pour une recette donnée
 */
function getMatchingIngredientsCount(recipe) {
  if (_selectedIngredients.size === 0) return 0;
  const recipeIngText = recipe.ingredients.map(i => i.name.toLowerCase()).join(' ');
  let count = 0;
  for (const ing of _selectedIngredients) {
    if (recipeIngText.includes(ing.toLowerCase())) {
      count++;
    }
  }
  return count;
}

export function renderRecipesView() {
  const container = document.getElementById('recipesContainer');
  if (!container) return;

  const lang = getLanguage();
  const authorConfig = getLocalizedAuthorConfig(lang);
  const popularIngredients = getLocalizedPopularIngredients(lang);
  const traditionFilters = getLocalizedTraditionFilters(lang);

  const filtered = getFilteredRecipes();
  const hasActiveFilters = _recipeSearchQuery || _selectedAuthor !== 'all' || _selectedTag !== 'all' || _selectedIngredients.size > 0;

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / _recipesPerPage));
  if (_currentRecipePage > totalPages) _currentRecipePage = totalPages;
  if (_currentRecipePage < 1) _currentRecipePage = 1;

  const startIndex = (_currentRecipePage - 1) * _recipesPerPage;
  const endIndex = Math.min(startIndex + _recipesPerPage, totalItems);
  const paginatedRecipes = filtered.slice(startIndex, endIndex);

  let html = `
    <!-- 1. APPLE-STYLE HEADER HERO -->
    <div class="recipe-apple-header">
      <div class="recipe-apple-header-left">
        <div class="recipe-apple-header-icon">🌿</div>
        <div>
          <h1 class="recipe-apple-header-title">
            ${t('recipes.headerTitle', {}, 'Pharmacopée Culinaire')}
          </h1>
          <p class="recipe-apple-header-sub">
            ${t('recipes.headerSubtitle', {}, "Recettes vivantes et régénérantes, inspirées de la nutrition électrique du Dr Sebi, d'Arnold Ehret, du Dr Morse et d'autres praticiens naturopathes.")}
          </p>
        </div>
      </div>
      <div>
        <span class="recipe-apple-header-badge">
          ${t('recipes.headerBadge', { count: VITALIST_RECIPES.length }, `${VITALIST_RECIPES.length} recettes fondatrices`)}
        </span>
      </div>
    </div>

    <!-- BANNIÈRE DE BASCULE VERS LA PHARMACOPÉE RAINTREE -->
    <div class="vital-apple-switch-banner" onclick="showPage('materia-medica')">
      <div class="vital-apple-switch-left">
        <div class="vital-apple-switch-icon">🌿</div>
        <div>
          <div class="vital-apple-switch-title">
            ${t('recipes.switchToMateriaTitle', {}, 'Pharmacopée Amazonienne & Plantes Médicinales')}
          </div>
          <div class="vital-apple-switch-sub">
            ${t('recipes.switchToMateriaSub', {}, 'Explorer 127 monographies phytochimiques et remèdes traditionnels de la forêt tropicale (Dr. Leslie Taylor).')}
          </div>
        </div>
      </div>
      <button type="button" class="vital-apple-switch-btn">
        <span>${t('recipes.switchToMateriaBtn', {}, 'Pharmacopée')}</span>
        <i class="ri-arrow-right-line"></i>
      </button>
    </div>

    <!-- 2. APPLE-STYLE SEARCH & MULTI-INGREDIENT CARD -->
    <div class="recipe-apple-search-card">
      <div class="recipe-apple-section-title">
        <span style="display:flex; align-items:center; gap:6px;">
          <span>🔍</span> ${t('recipes.searchSectionTitle', {}, 'Rechercher & ingrédients')}
        </span>
        ${hasActiveFilters ? `
          <button type="button" class="btn-secondary" onclick="clearAllRecipeFilters()" style="padding:3px 10px; font-size:0.75rem; border-radius:12px; color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08); cursor:pointer;">
            <i class="ri-close-circle-line"></i> ${t('common.cancel', {}, 'Effacer')}
          </button>
        ` : ''}
      </div>

      <div class="recipe-apple-search-input-wrap">
        <i class="ri-search-line"></i>
        <input 
          type="text" 
          id="recipeSearchInput" 
          class="recipe-apple-search-input"
          placeholder="${t('recipes.searchPlaceholder', {}, 'Rechercher une recette, un ingrédient...')}" 
          value="${esc(_recipeSearchQuery)}" 
          oninput="setRecipeSearchQuery(this.value)" 
          autocomplete="off"
        >
      </div>

      <div class="recipe-apple-ing-label">
        <span>${t('recipes.multiIngredientLabel', {}, 'Sélection multi-ingrédients')} ( ${_selectedIngredients.size} )</span>
        ${_selectedIngredients.size > 1 ? `
          <div style="display:inline-flex; background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:2px; font-size:0.72rem;">
            <button type="button" style="padding:2px 8px; border-radius:10px; border:none; cursor:pointer; font-weight:700; background:${_ingredientMatchMode === 'ANY' ? 'var(--accent)' : 'transparent'}; color:${_ingredientMatchMode === 'ANY' ? '#fff' : 'var(--text-dim)'};" onclick="setIngredientMatchMode('ANY')">
              ${lang === 'es' ? 'O' : (lang === 'en' ? 'OR' : 'OU')}
            </button>
            <button type="button" style="padding:2px 8px; border-radius:10px; border:none; cursor:pointer; font-weight:700; background:${_ingredientMatchMode === 'ALL' ? 'var(--accent)' : 'transparent'}; color:${_ingredientMatchMode === 'ALL' ? '#fff' : 'var(--text-dim)'};" onclick="setIngredientMatchMode('ALL')">
              ${lang === 'es' ? 'Y' : (lang === 'en' ? 'AND' : 'ET')}
            </button>
          </div>
        ` : ''}
      </div>

      <div class="recipe-apple-ing-grid">
        ${popularIngredients.map(ingObj => {
          const isSelected = _selectedIngredients.has(ingObj.raw);
          return `
            <button 
              type="button" 
              class="recipe-apple-ing-pill ${isSelected ? 'active' : ''}"
              onclick="toggleRecipeIngredientFilter('${esc(ingObj.raw)}')"
            >
              <span>${isSelected ? '✓' : '+'}</span>
              <span>${esc(ingObj.label)}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 3. APPLE-STYLE FILTERS CARD (AUTHORS & TRADITIONS) -->
    <div class="recipe-apple-filters-card">
      <!-- FILTRER PAR AUTEUR -->
      <div class="recipe-apple-filter-group-label">
        ${t('recipes.filterByAuthor', {}, 'Filtrer par auteur')}
      </div>
      <div class="recipe-apple-pills-row" style="margin-bottom:14px;">
        <button 
          type="button" 
          class="recipe-apple-pill ${_selectedAuthor === 'all' ? 'active' : ''}"
          onclick="setRecipeAuthorFilter('all')"
        >
          ${t('recipes.allAuthors', {}, 'Tous les auteurs')}
        </button>
        ${Object.keys(authorConfig).map(authorName => {
          const cfg = authorConfig[authorName];
          const isActive = _selectedAuthor === authorName;
          return `
            <button 
              type="button" 
              class="recipe-apple-pill ${isActive ? 'active' : ''}"
              onclick="setRecipeAuthorFilter('${esc(authorName)}')"
            >
              <span class="recipe-apple-dot" style="background:${cfg.dot};"></span>
              <span>${esc(cfg.label)}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- FILTRER PAR TRADITION -->
      <div class="recipe-apple-filter-group-label" style="border-top:1px solid var(--border); padding-top:12px;">
        ${t('recipes.filterByTradition', {}, 'Filtrer par tradition')}
      </div>
      <div class="recipe-apple-pills-row">
        ${traditionFilters.map(tf => {
          const isActive = _selectedTag === tf.id;
          return `
            <button 
              type="button" 
              class="recipe-apple-pill ${isActive ? 'active-tradition' : ''}"
              onclick="setRecipeTagFilter('${esc(tf.id)}')"
            >
              ${esc(tf.label)}
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- ANCRE DE DEFILEMENT RECETTES -->
    <div id="recipesGridAnchor" style="scroll-margin-top:90px;"></div>

    <!-- COMPTEUR DE RÉSULTATS -->
    <div style="margin: 0 4px 14px 4px; font-size:0.82rem; font-weight:700; color:var(--text-dim);">
      ${t('recipes.recipesCountDisplayed', { count: totalItems }, `${totalItems} recettes affichées`)}
    </div>

    <!-- 4. APPLE-STYLE RECIPES GRID -->
    ${totalItems === 0 ? `
      <div class="recipe-apple-card" style="padding:40px 20px; text-align:center; margin-bottom:30px;">
        <div style="font-size:2.5rem; margin-bottom:10px;">🍲</div>
        <h3 style="margin:0 0 6px 0; font-size:1.15rem; color:var(--text);">${t('recipes.noRecipesFound', {}, 'Aucune recette trouvée')}</h3>
        <p style="font-size:0.85rem; color:var(--text-dim); max-width:400px; margin:0 auto 16px auto;">
          ${t('recipes.noRecipesSubtitle', {}, 'Essayez de réinitialiser vos filtres ou vos termes de recherche.')}
        </p>
        <button type="button" class="recipe-apple-btn-solid" onclick="clearAllRecipeFilters()" style="margin:0 auto;">
          <i class="ri-refresh-line"></i> ${t('recipes.allOption', {}, 'Toutes les recettes')}
        </button>
      </div>
    ` : `
      <div class="recipe-apple-grid">
        ${paginatedRecipes.map(rawRecipe => renderRecipeCard(rawRecipe, lang)).join('')}
      </div>

      <!-- COMPOSANT DE PAGINATION COMPLET -->
      ${renderPaginationControls(_currentRecipePage, totalPages, totalItems, _recipesPerPage)}
    `}
  `;

  container.innerHTML = html;

  // Si la modale de recette est actuellement ouverte, rafraîchir son contenu dans la nouvelle langue
  const modalOverlay = document.getElementById('recipeDetailModal');
  if (modalOverlay && modalOverlay.classList.contains('open') && _activeModalRecipe) {
    renderModalContent();
  }
}

/**
 * Génère la carte Apple épurée d'une recette
 */
function renderRecipeCard(rawRecipe, lang = 'fr') {
  const recipe = getLocalizedRecipe(rawRecipe, lang);
  const authorConfig = getLocalizedAuthorConfig(lang);
  const authorCfg = authorConfig[rawRecipe.author] || authorConfig[recipe.author] || {
    badgeBg: "rgba(148,163,184,0.12)",
    badgeColor: "var(--text-dim)",
    label: recipe.author
  };

  const pralColor = recipe.pralScore < 0 ? '#10b981' : (recipe.pralScore > 5 ? '#ef4444' : '#f59e0b');

  return `
    <div 
      class="recipe-apple-card" 
      onclick="openRecipeModal('${esc(recipe.id)}')"
    >
      <div>
        <!-- ENTÊTE DE CARTE : AUTEUR, PRAL & VIDÉO -->
        <div class="recipe-apple-card-top">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span class="recipe-apple-author-badge" style="background:${authorCfg.badgeBg}; color:${authorCfg.badgeColor};">
              ${esc(recipe.author.toUpperCase())}
            </span>
            ${recipe.videoUrl ? `
              <span class="recipe-apple-video-badge">
                <i class="ri-youtube-fill"></i> ${t('recipes.videoDemoShort', {}, 'Vidéo')}
              </span>
            ` : ''}
          </div>
          <span class="recipe-apple-pral-badge">
            PRAL <strong style="color:${pralColor};">${recipe.pralScore > 0 ? '+' : ''}${recipe.pralScore}</strong>
          </span>
        </div>

        <!-- TITRE & SOUS-TITRE -->
        <h3 class="recipe-apple-card-title">
          ${esc(recipe.title)}
        </h3>
        <p class="recipe-apple-card-sub">
          ${esc(recipe.subtitle)}
        </p>

        <!-- DESCRIPTION COURTE (2 LIGNES) -->
        <p class="recipe-apple-card-desc">
          ${esc(recipe.description)}
        </p>

        <!-- APERÇU DES INGRÉDIENTS CLÉS -->
        <div class="recipe-apple-card-ings">
          ${recipe.ingredients.slice(0, 3).map(ing => `
            <span class="recipe-apple-card-ing-tag">
              ${esc(ing.name.split('(')[0].trim())}
            </span>
          `).join('')}
          ${recipe.ingredients.length > 3 ? `
            <span class="recipe-apple-card-ing-tag" style="color:var(--accent); font-weight:700;">
              +${recipe.ingredients.length - 3}
            </span>
          ` : ''}
        </div>
      </div>

      <!-- PIED DE CARTE : INFOS TEMPS & ACTION -->
      <div class="recipe-apple-card-footer">
        <div class="recipe-apple-meta-item">
          <span>⏱ ${esc(recipe.prepTime)}</span>
        </div>
        <div class="recipe-apple-meta-item">
          <span>🪄 ${t('recipes.vitalityBadge', {}, 'Vitalité')} ${recipe.vitalityScore}%</span>
        </div>
        <div class="recipe-apple-explore-link">
          <span>${t('recipes.explorerBtn', {}, 'Explorer')}</span>
          <i class="ri-arrow-right-line"></i>
        </div>
      </div>
    </div>
  `;
}

/**
 * Génère le composant de contrôle de pagination
 */
function renderPaginationControls(currentPage, totalPages, totalItems, recipesPerPage) {
  if (totalItems <= 12 && recipesPerPage >= totalItems) return '';

  const startIndex = (currentPage - 1) * recipesPerPage + 1;
  const endIndex = Math.min(currentPage * recipesPerPage, totalItems);

  const pageNumbers = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    if (currentPage <= 4) {
      pageNumbers.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pageNumbers.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
  }

  const showingTpl = t('recipes.paginationShowing');
  const showingText = (showingTpl || 'Affichage de {start} à {end} sur {total} recettes')
    .replace('{start}', startIndex)
    .replace('{end}', endIndex)
    .replace('{total}', totalItems);

  return `
    <div class="dash-card glass recipes-pagination-wrap" style="border-radius:18px;">
      <!-- STATS & INFO PAGE -->
      <div class="recipes-pagination-stats">
        <span>📖 ${showingText}</span>
        <span style="opacity:0.4;">•</span>
        <span>${t('recipes.pageLabel', {}, 'Page')} <strong>${currentPage}</strong> / ${totalPages}</span>
      </div>

      <!-- SÉLECTEUR RECETTES PAR PAGE -->
      <div class="recipes-pagination-limit-wrap">
        <span>${t('recipes.perPageLabel', {}, 'Par page')} :</span>
        <div style="display:inline-flex; gap:4px;">
          ${[12, 24, 48].map(limit => `
            <button 
              type="button" 
              class="recipes-per-page-pill ${recipesPerPage === limit ? 'active' : ''}"
              onclick="setRecipesPerPage(${limit})"
              title="${limit} ${t('recipes.perPageLabel', {}, 'Par page')}"
            >
              ${limit}
            </button>
          `).join('')}
          <button 
            type="button" 
            class="recipes-per-page-pill ${recipesPerPage >= 9999 ? 'active' : ''}"
            onclick="setRecipesPerPage('all')"
            title="${t('recipes.allOption', {}, 'Toutes')}"
          >
            ${t('recipes.allOption', {}, 'Toutes')}
          </button>
        </div>
      </div>

      <!-- BOUTONS DE NAVIGATION -->
      ${totalPages > 1 ? `
        <div class="recipes-pagination-controls" role="navigation" aria-label="Pagination">
          <!-- BOUTON PREMIER -->
          <button 
            type="button" 
            class="recipe-page-btn nav-btn" 
            onclick="setRecipePage(1)"
            ${currentPage === 1 ? 'disabled aria-disabled="true"' : ''}
            title="${t('recipes.firstPage', {}, 'Premier')}"
          >
            <i class="ri-skip-back-line"></i>
          </button>

          <!-- BOUTON PRÉCÉDENT -->
          <button 
            type="button" 
            class="recipe-page-btn nav-btn" 
            onclick="setRecipePage(${currentPage - 1})"
            ${currentPage === 1 ? 'disabled aria-disabled="true"' : ''}
            title="${t('recipes.prevPage', {}, 'Précédent')}"
          >
            <i class="ri-arrow-left-s-line"></i>
            <span class="nav-text">${t('recipes.prevPage', {}, 'Précédent')}</span>
          </button>

          <!-- NUMÉROS DE PAGE -->
          ${pageNumbers.map(p => {
            if (p === '...') {
              return `<span class="recipe-page-ellipsis">…</span>`;
            }
            const isActive = p === currentPage;
            return `
              <button 
                type="button" 
                class="recipe-page-btn ${isActive ? 'active' : ''}" 
                onclick="setRecipePage(${p})"
                ${isActive ? 'aria-current="page"' : ''}
              >
                ${p}
              </button>
            `;
          }).join('')}

          <!-- BOUTON SUIVANT -->
          <button 
            type="button" 
            class="recipe-page-btn nav-btn" 
            onclick="setRecipePage(${currentPage + 1})"
            ${currentPage === totalPages ? 'disabled aria-disabled="true"' : ''}
            title="${t('recipes.nextPage', {}, 'Suivant')}"
          >
            <span class="nav-text">${t('recipes.nextPage', {}, 'Suivant')}</span>
            <i class="ri-arrow-right-s-line"></i>
          </button>

          <!-- BOUTON DERNIER -->
          <button 
            type="button" 
            class="recipe-page-btn nav-btn" 
            onclick="setRecipePage(${totalPages})"
            ${currentPage === totalPages ? 'disabled aria-disabled="true"' : ''}
            title="${t('recipes.lastPage', {}, 'Dernier')}"
          >
            <i class="ri-skip-forward-line"></i>
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Ouvre la modale complète avec calculateur de portions Apple
 */
export function openRecipeModal(recipeId) {
  const recipe = VITALIST_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return;

  _activeModalRecipe = recipe;
  _currentModalServings = recipe.servings || 4;

  let modalOverlay = document.getElementById('recipeDetailModal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'recipeDetailModal';
    modalOverlay.className = 'recipe-apple-modal-overlay';
    modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeRecipeModal(); };
    document.body.appendChild(modalOverlay);
  }

  renderModalContent();
  modalOverlay.classList.add('open');
  modalOverlay.style.display = 'flex';
  modalOverlay.style.zIndex = '10050';
  document.body.style.overflow = 'hidden';
}

export function setRecipeModalServings(newServings) {
  if (!_activeModalRecipe) return;
  _currentModalServings = newServings;
  renderModalContent();
}

function renderModalContent() {
  const modalOverlay = document.getElementById('recipeDetailModal');
  if (!modalOverlay || !_activeModalRecipe) return;

  const lang = getLanguage();
  const r = getLocalizedRecipe(_activeModalRecipe, lang);
  const authorConfig = getLocalizedAuthorConfig(lang);
  const baseServings = _activeModalRecipe.servings || r.servings || 4;
  const multiplier = _currentModalServings / baseServings;

  const authorCfg = authorConfig[_activeModalRecipe.author] || authorConfig[r.author] || {
    badgeBg: "rgba(16,185,129,0.12)",
    badgeColor: "#059669",
    label: r.author
  };

  modalOverlay.innerHTML = `
    <div class="recipe-apple-modal-card" onclick="event.stopPropagation()">
      
      <!-- BOUTON FERMER ÉPURÉ ✕ -->
      <button type="button" class="recipe-apple-close-btn" onclick="closeRecipeModal()" aria-label="${t('common.close', {}, 'Fermer')}" title="${t('common.close', {}, 'Fermer')} (Échap)">
        ✕
      </button>

      <!-- ENTÊTE DE LA FICHE -->
      <div class="recipe-apple-modal-header">
        <div style="margin-bottom:6px;">
          <span class="recipe-apple-author-badge" style="background:${authorCfg.badgeBg}; color:${authorCfg.badgeColor};">
            ${esc(r.author.toUpperCase())}
          </span>
        </div>
        <h2 class="recipe-apple-modal-title">
          ${esc(r.title)}
        </h2>
        <p class="recipe-apple-modal-sub">
          ${esc(r.subtitle)}
        </p>
      </div>

      <!-- BADGES METRIQUES -->
      <div class="recipe-apple-modal-badges">
        <span class="recipe-apple-meta-pill">
          ⏱ ${t('recipes.prepTime', {}, 'Préparation')} : ${esc(r.prepTime)}
        </span>
        <span class="recipe-apple-meta-pill">
          🔥 ${t('recipes.cookTime', {}, 'Cuisson')} : ${esc(r.cookTime)}
        </span>
        <span class="recipe-apple-meta-pill green">
          PRAL ${r.pralScore > 0 ? '+' : ''}${r.pralScore} mEq
        </span>
        <span class="recipe-apple-meta-pill green">
          🍃 ${t('recipes.vitalityBadge', {}, 'Vitalité')} ${r.vitalityScore}%
        </span>
      </div>

      <!-- ACTION VITALISTE PRINCIPALE CARD -->
      <div class="recipe-apple-action-box">
        <div class="recipe-apple-action-box-title">
          <span>⚡</span>
          <span>${t('recipes.vitalistAction', {}, 'ACTION VITALISTE PRINCIPALE')}</span>
        </div>
        <p class="recipe-apple-action-box-text">
          ${esc(r.vitalistAction)}
        </p>
        <div>
          <div style="font-size:0.75rem; color:var(--text-dim); margin-bottom:6px; font-weight:600;">
            ${t('recipes.targetEmunctoriesTitle', {}, 'Organes et émonctoires ciblés :')}
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${r.targetEmunctories.map(e => `
              <span class="recipe-apple-organ-pill">
                ${esc(e)}
              </span>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- INGRÉDIENTS VIVANTS & CALCULATEUR DE PORTIONS -->
      <div style="margin-bottom:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
          <h3 style="margin:0; font-size:1rem; font-weight:800; color:var(--text);">
            ${t('recipes.livingIngredients', {}, 'Ingrédients vivants')}
          </h3>
          <div class="recipe-apple-portion-bar">
            ${[1, 2, 4, 6].map(p => `
              <button 
                type="button" 
                class="recipe-apple-portion-btn ${_currentModalServings === p ? 'active' : ''}"
                onclick="setRecipeModalServings(${p})"
              >
                ${p} ${t('recipes.pers', {}, 'pers.')}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="recipe-apple-ing-grid-2col">
          ${r.ingredients.map(ing => {
            const adjustedQty = (ing.quantity * multiplier);
            const displayQty = adjustedQty % 1 === 0 ? adjustedQty : adjustedQty.toFixed(1);
            return `
              <label class="recipe-apple-ing-card">
                <input type="checkbox" style="width:16px; height:16px; accent-color:var(--accent); cursor:pointer;">
                <div style="flex:1;">
                  <div style="font-size:0.84rem; font-weight:700; color:var(--text);">
                    <span style="color:var(--accent); font-weight:800;">${displayQty} ${esc(ing.unit)}</span> — ${esc(ing.name)}
                  </div>
                  ${ing.note ? `<div style="font-size:0.72rem; color:var(--text-dim); margin-top:2px;">${esc(ing.note)}</div>` : ''}
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <!-- PROTOCOLE DE PRÉPARATION ÉTAPE PAR ÉTAPE -->
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 10px 0; font-size:1rem; font-weight:800; color:var(--text);">
          ${t('recipes.prepProtocol', {}, 'Protocole de préparation')}
        </h3>
        <div>
          ${r.instructions.map((step, idx) => `
            <div class="recipe-apple-step-card">
              <div class="recipe-apple-step-num">
                ${idx + 1}
              </div>
              <p style="margin:0; font-size:0.85rem; color:var(--text); line-height:1.45;">
                ${esc(step)}
              </p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- DÉMONSTRATION VIDÉO -->
      <div class="recipe-apple-video-card">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size:1.4rem; color:#ef4444;">
            <i class="ri-video-line"></i>
          </div>
          <div>
            <div style="font-weight:700; font-size:0.84rem; color:var(--text);">
              ${t('recipes.videoDemo', {}, 'Démonstration vidéo')}
            </div>
            <div style="font-size:0.76rem; color:var(--text-dim); margin-top:1px;">
              ${r.videoUrl ? t('recipes.videoDemoDesc', {}, 'Visionnez la préparation pas-à-pas sur YouTube.') : t('recipes.noVideoYet', {}, "Aucun lien vidéo vérifié n'est encore associé à cette recette.")}
            </div>
          </div>
        </div>
        ${r.videoUrl ? `
          <a href="${esc(r.videoUrl)}" target="_blank" rel="noopener noreferrer" class="recipe-apple-btn-outline" style="color:#ef4444; border-color:rgba(239,68,68,0.3); font-size:0.78rem; padding:6px 14px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;">
            ▶ ${t('recipes.watchVideoShort', {}, 'Voir la vidéo')}
          </a>
        ` : `
          <button type="button" class="recipe-apple-btn-outline" disabled style="opacity:0.5; font-size:0.78rem; padding:6px 14px; cursor:not-allowed;">
            ▶ ${t('recipes.watchVideoShort', {}, 'Voir la vidéo')}
          </button>
        `}
      </div>

      <!-- PIED DE FICHE : BOUTONS D'ACTION -->
      <div class="recipe-apple-modal-footer">
        <button type="button" class="recipe-apple-btn-outline" onclick="copyRecipeToClipboard('${esc(r.id)}')">
          ${t('recipes.copyRecipeBtn', {}, 'Copier la recette')}
        </button>
        <button type="button" class="recipe-apple-btn-solid" onclick="addRecipeToFavorites('${esc(r.id)}')">
          <span>💚</span>
          <span>${t('recipes.saveToFavoritesBtn', {}, 'Enregistrer dans mes favoris')}</span>
        </button>
      </div>

    </div>
  `;
}

export function closeRecipeModal() {
  const modalOverlay = document.getElementById('recipeDetailModal');
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
  }
  document.body.style.overflow = '';
  _activeModalRecipe = null;
}

export function copyRecipeToClipboard(recipeId) {
  const rawRecipe = VITALIST_RECIPES.find(r => r.id === recipeId);
  if (!rawRecipe) return;

  const lang = getLanguage();
  const recipe = getLocalizedRecipe(rawRecipe, lang);

  const text = `🍽️ ${recipe.title} (${recipe.subtitle})\n` +
    `👨‍⚕️ ${t('recipes.filterByAuthor', {}, 'Auteur')} : ${recipe.author} — Source : ${recipe.bookReference}\n` +
    `⏱️ ${t('recipes.prepTime', {}, 'Préparation')} : ${recipe.prepTime} | ${recipe.cookTime} | PRAL : ${recipe.pralScore}\n\n` +
    `🥗 ${t('recipes.ingredientsTitle', {}, 'Ingrédients')} (${_currentModalServings} ${t('recipes.pers', {}, 'pers.')}) :\n` +
    recipe.ingredients.map(i => `- ${((i.quantity * (_currentModalServings / (rawRecipe.servings || 4)))).toFixed(1)} ${i.unit} ${i.name} (${i.note || ''})`).join('\n') +
    `\n\n👨‍🍳 ${t('recipes.instructionsTitle', {}, 'Instructions')} :\n` +
    recipe.instructions.map((step, idx) => `${idx + 1}. ${step}`).join('\n') +
    `\n\n🌿 ${t('recipes.vitalistAction', {}, 'Action Vitaliste')} : ${recipe.vitalistAction}`;

  navigator.clipboard.writeText(text).then(() => {
    if (window.showToast) {
      window.showToast(t('toasts.copiedToClipboard', {}, '✓ Copié dans le presse-papier !'), 'success');
    } else {
      alert(t('toasts.copiedToClipboard', {}, '✓ Copié !'));
    }
  }).catch(() => {
    alert("Copied.");
  });
}

export function addRecipeToFavorites(recipeId) {
  const rawRecipe = VITALIST_RECIPES.find(r => r.id === recipeId);
  if (!rawRecipe) return;

  const lang = getLanguage();
  const recipe = getLocalizedRecipe(rawRecipe, lang);

  if (window.showToast) {
    window.showToast(`❤️ ${recipe.title} — ${t('recipes.saveToFavoritesBtn', {}, 'Enregistré dans mes favoris')}`, 'success');
  } else {
    alert(`${recipe.title} — ${t('recipes.saveToFavoritesBtn', {}, 'Enregistré dans mes favoris')}`);
  }
}
