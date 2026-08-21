/**
 * recipesModule.js
 * 
 * Module interactif de Pharmacopée Culinaire & Recettes Éprouvées.
 * Permet la recherche multi-ingrédients, le filtrage par auteur et mode diététique,
 * le calcul dynamique de portions et la consultation des fiches cliniques.
 */

import { VITALIST_RECIPES, RECIPE_AUTHORS, RECIPE_TAGS, POPULAR_INGREDIENTS } from './data/recipesData.js';

let _recipeSearchQuery = '';
let _selectedAuthor = 'all';
let _selectedTag = 'all';
let _selectedIngredients = new Set();
let _ingredientMatchMode = 'ANY'; // 'ANY' (inclusif) ou 'ALL' (exclusif)
let _activeModalRecipe = null;
let _currentModalServings = 2;

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
  window.openRecipeModal = openRecipeModal;
  window.closeRecipeModal = closeRecipeModal;
  window.setRecipeModalServings = setRecipeModalServings;
  window.copyRecipeToClipboard = copyRecipeToClipboard;
  window.addRecipeToFavorites = addRecipeToFavorites;
}

export function setRecipeSearchQuery(query) {
  _recipeSearchQuery = query.trim();
  renderRecipesView();
}

export function setRecipeAuthorFilter(author) {
  _selectedAuthor = author;
  renderRecipesView();
}

export function setRecipeTagFilter(tag) {
  _selectedTag = tag;
  renderRecipesView();
}

export function toggleRecipeIngredientFilter(ing) {
  if (_selectedIngredients.has(ing)) {
    _selectedIngredients.delete(ing);
  } else {
    _selectedIngredients.add(ing);
  }
  renderRecipesView();
}

export function setIngredientMatchMode(mode) {
  _ingredientMatchMode = mode;
  renderRecipesView();
}

export function clearAllRecipeFilters() {
  _recipeSearchQuery = '';
  _selectedAuthor = 'all';
  _selectedTag = 'all';
  _selectedIngredients.clear();
  const searchInput = document.getElementById('recipeSearchInput');
  if (searchInput) searchInput.value = '';
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
    if (_selectedTag !== 'all' && !recipe.tags.includes(_selectedTag)) {
      return false;
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
        // Tous les ingrédients sélectionnés doivent être présents
        const allPresent = selectedIngArray.every(ing => recipeIngredientsText.includes(ing));
        if (!allPresent) return false;
      } else {
        // Au moins un ingrédient sélectionné doit être présent
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

  const filtered = getFilteredRecipes();
  const hasActiveFilters = _recipeSearchQuery || _selectedAuthor !== 'all' || _selectedTag !== 'all' || _selectedIngredients.size > 0;

  let html = `
    <!-- HEADER HERO PHARMACOPEE CULINAIRE -->
    <div class="dash-greeting glass" style="margin-bottom:20px; padding:22px 24px; position:relative; overflow:hidden;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div class="page-header-wrap" style="margin:0;">
          <div class="header-icon-tile" style="background:linear-gradient(135deg, rgba(16,185,129,0.25), rgba(56,189,248,0.25)); font-size:1.8rem; width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center;">🍽️</div>
          <div>
            <h1 style="margin:0; font-size:1.45rem; font-weight:800; color:var(--text); letter-spacing:-0.3px;">
              Pharmacopée Culinaire &amp; Recettes Éprouvées
            </h1>
            <p class="subtitle" style="margin:2px 0 0 0; font-size:0.85rem;">
              Recettes thérapeutiques authentiques et sourcées des grands maîtres vitalistes (Dr. Sebi, Arnold Ehret, Dr. Morse, David Wolfe, Dr. Kallas, Dr. Christopher).
            </p>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="badge badge-success" style="font-size:0.8rem; font-weight:700; padding:6px 14px; border-radius:20px;">
            ✨ ${VITALIST_RECIPES.length} Recettes Fondatrices
          </span>
        </div>
      </div>
    </div>

    <!-- MODULE DE RECHERCHE TEMPS REEL & MULTI-CRITERES -->
    <div class="dash-card glass" style="padding:18px 20px; margin-bottom:20px; border:1px solid var(--border);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.1rem;">🔍</span>
          <span style="font-weight:700; font-size:0.95rem; color:var(--text);">Recherche par Mots-Clés &amp; Ingrédients</span>
        </div>
        ${hasActiveFilters ? `
          <button type="button" class="btn-secondary" onclick="clearAllRecipeFilters()" style="padding:4px 12px; font-size:0.75rem; border-radius:14px; color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.1); cursor:pointer;">
            <i class="ri-close-circle-line"></i> Réinitialiser les filtres
          </button>
        ` : ''}
      </div>

      <div class="media-search-box-wrap" style="position:relative; margin-bottom:16px;">
        <i class="ri-search-line search-icon" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-dim);"></i>
        <input 
          type="text" 
          id="recipeSearchInput" 
          placeholder="Rechercher une recette, un ingrédient ou une action (ex: sea moss, pourpier, balai intestinal, acide urique, teff)..." 
          value="${esc(_recipeSearchQuery)}" 
          oninput="setRecipeSearchQuery(this.value)" 
          style="width:100%; padding:12px 14px 12px 42px; border-radius:12px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:0.9rem;"
          autocomplete="off"
        >
      </div>

      <!-- SÉLECTEUR MULTI-INGRÉDIENTS INTERACTIF -->
      <div style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:700; color:var(--text-dim);">
            <i class="ri-leaf-line" style="color:var(--accent);"></i>
            <span>Sélection Multi-Ingrédients (${_selectedIngredients.size} sélectionnés) :</span>
          </div>
          ${_selectedIngredients.size > 1 ? `
            <div style="display:inline-flex; background:var(--surface-hover); border:1px solid var(--border); border-radius:14px; padding:2px; font-size:0.72rem;">
              <button type="button" style="padding:2px 8px; border-radius:12px; border:none; cursor:pointer; font-weight:700; background:${_ingredientMatchMode === 'ANY' ? 'var(--accent)' : 'transparent'}; color:${_ingredientMatchMode === 'ANY' ? '#fff' : 'var(--text-dim)'};" onclick="setIngredientMatchMode('ANY')">
                Au moins un (OU)
              </button>
              <button type="button" style="padding:2px 8px; border-radius:12px; border:none; cursor:pointer; font-weight:700; background:${_ingredientMatchMode === 'ALL' ? 'var(--accent)' : 'transparent'}; color:${_ingredientMatchMode === 'ALL' ? '#fff' : 'var(--text-dim)'};" onclick="setIngredientMatchMode('ALL')">
                Tous ensemble (ET)
              </button>
            </div>
          ` : ''}
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:130px; overflow-y:auto; padding-right:4px;">
          ${POPULAR_INGREDIENTS.map(ing => {
            const isSelected = _selectedIngredients.has(ing);
            return `
              <button 
                type="button" 
                class="recipe-ing-chip"
                onclick="toggleRecipeIngredientFilter('${esc(ing)}')"
                style="padding:5px 12px; border-radius:20px; font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.2s ease; display:inline-flex; align-items:center; gap:5px; border:1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}; background:${isSelected ? 'var(--accent)' : 'var(--surface)'}; color:${isSelected ? '#ffffff' : 'var(--text)'}; box-shadow:${isSelected ? '0 2px 8px rgba(16,185,129,0.35)' : 'none'};"
              >
                <span>${isSelected ? '✓' : '+'}</span>
                <span>${esc(ing)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- FILTRES PAR AUTEURS -->
      <div style="border-top:1px solid var(--border); padding-top:14px; margin-top:14px;">
        <div style="font-size:0.8rem; font-weight:700; color:var(--text-dim); margin-bottom:8px;">
          📚 Filtrer par Auteur &amp; Tradition Thérapeutique :
        </div>
        <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px;" class="hide-scrollbar">
          ${RECIPE_AUTHORS.map(a => {
            const isActive = _selectedAuthor === a.id;
            return `
              <button 
                type="button" 
                class="btn-tab ${isActive ? 'active' : ''}" 
                onclick="setRecipeAuthorFilter('${esc(a.id)}')"
                style="padding:6px 14px; font-size:0.8rem; font-weight:700; white-space:nowrap; border-radius:16px; display:inline-flex; align-items:center; gap:6px;"
              >
                <span>${a.icon}</span>
                <span>${esc(a.name)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- FILTRES PAR MODES ALIMENTAIRES & ACTIONS -->
      <div style="border-top:1px solid var(--border); padding-top:12px; margin-top:12px;">
        <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px;" class="hide-scrollbar">
          ${RECIPE_TAGS.map(t => {
            const isActive = _selectedTag === t.id;
            return `
              <button 
                type="button" 
                class="recipe-tag-pill ${isActive ? 'active' : ''}" 
                onclick="setRecipeTagFilter('${esc(t.id)}')"
                style="padding:4px 12px; font-size:0.75rem; font-weight:600; white-space:nowrap; border-radius:14px; border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}; background:${isActive ? 'rgba(16,185,129,0.15)' : 'var(--surface-hover)'}; color:${isActive ? 'var(--accent)' : 'var(--text-dim)'}; cursor:pointer;"
              >
                ${esc(t.label)}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- COMPTEUR DE RÉSULTATS -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding:0 4px;">
      <span style="font-size:0.85rem; font-weight:700; color:var(--text-dim);">
        Affichage de <span style="color:var(--accent); font-weight:800;">${filtered.length}</span> recette${filtered.length > 1 ? 's' : ''}
      </span>
      ${_selectedIngredients.size > 0 ? `
        <span class="badge badge-purple" style="font-size:0.75rem;">
          🎯 Filtré par ${_selectedIngredients.size} ingrédient${_selectedIngredients.size > 1 ? 's' : ''}
        </span>
      ` : ''}
    </div>

    <!-- GRILLE DES RECETTES -->
    ${filtered.length === 0 ? `
      <div class="dash-card glass" style="padding:40px 20px; text-align:center; margin-bottom:30px;">
        <div style="font-size:2.5rem; margin-bottom:10px;">🍲</div>
        <h3 style="margin:0 0 6px 0; font-size:1.15rem; color:var(--text);">Aucune recette ne correspond à votre sélection</h3>
        <p style="font-size:0.85rem; color:var(--text-dim); max-width:400px; margin:0 auto 16px auto;">
          Essayez d'élargir vos ingrédients ou de réinitialiser vos filtres d'auteurs et de catégories.
        </p>
        <button type="button" class="btn-primary" onclick="clearAllRecipeFilters()" style="padding:8px 20px; font-size:0.85rem; border-radius:18px; margin:0 auto;">
          <i class="ri-refresh-line"></i> Afficher toutes les recettes
        </button>
      </div>
    ` : `
      <div class="recipes-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:18px; margin-bottom:40px;">
        ${filtered.map(recipe => renderRecipeCard(recipe)).join('')}
      </div>
    `}
  `;

  container.innerHTML = html;
}

/**
 * Génère la carte visuelle d'une recette
 */
function renderRecipeCard(recipe) {
  const matchCount = getMatchingIngredientsCount(recipe);
  const authorBadgeColors = {
    "Dr. Sebi": { bg: "rgba(16,185,129,0.15)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
    "Prof. Arnold Ehret": { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
    "Dr. Robert Morse": { bg: "rgba(139,92,246,0.15)", text: "#8b5cf6", border: "rgba(139,92,246,0.3)" },
    "David Wolfe": { bg: "rgba(244,63,94,0.15)", text: "#f43f5e", border: "rgba(244,63,94,0.3)" },
    "Dr. John Kallas": { bg: "rgba(34,197,94,0.15)", text: "#22c55e", border: "rgba(34,197,94,0.3)" },
    "Dr. John R. Christopher": { bg: "rgba(99,102,241,0.15)", text: "#6366f1", border: "rgba(99,102,241,0.3)" }
  };
  const ac = authorBadgeColors[recipe.author] || { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" };

  return `
    <div 
      class="dash-card glass recipe-card" 
      onclick="openRecipeModal('${esc(recipe.id)}')"
      style="padding:18px; border-radius:18px; border:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between; cursor:pointer; transition:transform 0.2s ease, box-shadow 0.2s ease; position:relative; overflow:hidden;"
      onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 30px rgba(0,0,0,0.15)';"
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
    >
      <div>
        <!-- ENTÊTE DE CARTE : AUTEUR, PRAL & VIDÉO -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:8px; flex-wrap:wrap;">
          <span style="font-size:0.72rem; font-weight:800; padding:4px 10px; border-radius:12px; background:${ac.bg}; color:${ac.text}; border:1px solid ${ac.border}; text-transform:uppercase; letter-spacing:0.5px;">
            ${esc(recipe.author)}
          </span>
          <div style="display:flex; align-items:center; gap:6px;">
            ${recipe.videoUrl ? `
              <span style="font-size:0.7rem; font-weight:700; color:#ef4444; background:rgba(239,68,68,0.12); padding:3px 7px; border-radius:10px; display:inline-flex; align-items:center; gap:3px;">
                <i class="ri-youtube-fill"></i> Vidéo
              </span>
            ` : ''}
            <span style="font-size:0.72rem; font-weight:700; color:#10b981; background:rgba(16,185,129,0.12); padding:3px 8px; border-radius:10px;">
              PRAL ${recipe.pralScore}
            </span>
          </div>
        </div>

        <!-- TITRE & SOUS-TITRE -->
        <h3 style="margin:0 0 4px 0; font-size:1.1rem; font-weight:800; color:var(--text); line-height:1.3;">
          ${esc(recipe.title)}
        </h3>
        <p style="font-size:0.78rem; color:var(--text-dim); margin:0 0 10px 0; font-weight:600;">
          ${esc(recipe.subtitle)}
        </p>

        <!-- DESCRIPTION COURTE -->
        <p style="font-size:0.82rem; color:var(--text); line-height:1.45; margin:0 0 14px 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${esc(recipe.description)}
        </p>

        <!-- APERÇU DES INGRÉDIENTS CLÉS -->
        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:14px;">
          ${recipe.ingredients.slice(0, 4).map(ing => `
            <span style="font-size:0.7rem; padding:2px 8px; border-radius:8px; background:var(--surface-hover); color:var(--text-dim); border:1px solid var(--border);">
              ${esc(ing.name.split('(')[0].trim())}
            </span>
          `).join('')}
          ${recipe.ingredients.length > 4 ? `
            <span style="font-size:0.7rem; padding:2px 6px; border-radius:8px; background:var(--surface-hover); color:var(--accent); font-weight:700;">
              +${recipe.ingredients.length - 4}
            </span>
          ` : ''}
        </div>
      </div>

      <!-- PIED DE CARTE : INFOS TEMPS & MATCH -->
      <div style="border-top:1px solid var(--border); padding-top:10px; display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
        <div style="display:flex; gap:10px; font-size:0.75rem; color:var(--text-dim); font-weight:600;">
          <span>⏱️ ${esc(recipe.prepTime)}</span>
          <span>⚡ Vitalité ${recipe.vitalityScore}%</span>
        </div>
        ${matchCount > 0 ? `
          <span style="font-size:0.7rem; font-weight:800; color:#10b981; background:rgba(16,185,129,0.15); padding:2px 8px; border-radius:10px;">
            ✓ ${matchCount} ingrédient${matchCount > 1 ? 's' : ''}
          </span>
        ` : `
          <span style="font-size:0.75rem; font-weight:700; color:var(--accent); display:flex; align-items:center; gap:3px;">
            Consulter <i class="ri-arrow-right-s-line"></i>
          </span>
        `}
      </div>
    </div>
  `;
}

/**
 * Ouvre la modale complète avec calculateur de portions
 */
export function openRecipeModal(recipeId) {
  const recipe = VITALIST_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return;

  _activeModalRecipe = recipe;
  _currentModalServings = recipe.servings || 2;

  let modalOverlay = document.getElementById('recipeDetailModal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'recipeDetailModal';
    modalOverlay.className = 'modal-overlay';
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

  const r = _activeModalRecipe;
  const baseServings = r.servings || 2;
  const multiplier = _currentModalServings / baseServings;

  modalOverlay.innerHTML = `
    <div class="modal-card glass" onclick="event.stopPropagation()" style="max-width:800px; width:95%; max-height:92vh; overflow-y:auto; border-radius:24px; padding:24px; position:relative; border:1px solid var(--border); box-shadow:0 25px 60px rgba(0,0,0,0.5);">
      
      <!-- BOUTON FERMER UNIFIÉ -->
      <button type="button" class="modal-close-unified" onclick="closeRecipeModal()" aria-label="Fermer la recette" title="Fermer (Échap)">
        <i class="ri-close-line"></i>
      </button>

      <!-- ENTÊTE SOURCE ET AUTEUR -->
      <div style="padding-right:90px; margin-bottom:12px;">
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">
          <span class="badge badge-success" style="font-size:0.75rem; font-weight:800;">
            ${esc(r.author)}
          </span>
          <span style="font-size:0.75rem; color:var(--text-dim); font-weight:600;">
            📖 ${esc(r.bookReference)}
          </span>
        </div>
        <h2 style="margin:0 0 4px 0; font-size:1.4rem; font-weight:800; color:var(--text); line-height:1.25;">
          ${esc(r.title)}
        </h2>
        <p style="margin:0; font-size:0.88rem; color:var(--text-dim); font-weight:600;">
          ${esc(r.subtitle)}
        </p>
      </div>

      <!-- BADGES METRIQUES -->
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border);">
        <span style="font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:10px; background:var(--surface-hover); border:1px solid var(--border); color:var(--text);">
          ⏱️ Préparation : ${esc(r.prepTime)}
        </span>
        <span style="font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:10px; background:var(--surface-hover); border:1px solid var(--border); color:var(--text);">
          🔥 Cuisson : ${esc(r.cookTime)}
        </span>
        <span style="font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:10px; background:rgba(16,185,129,0.15); color:#10b981;">
          🌱 PRAL : ${r.pralScore} mEq
        </span>
        <span style="font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:10px; background:rgba(56,189,248,0.15); color:#38bdf8;">
          ⚡ Vitalité : ${r.vitalityScore}%
        </span>
      </div>

      <!-- DESCRIPTION & ACTION VITALISTE CLINIQUE -->
      <div class="dash-card glass" style="padding:14px 16px; margin-bottom:20px; background:linear-gradient(135deg, rgba(16,185,129,0.08), rgba(56,189,248,0.08)); border:1px solid rgba(16,185,129,0.25);">
        <div style="display:flex; align-items:center; gap:6px; font-size:0.82rem; font-weight:800; color:var(--accent); margin-bottom:4px; text-transform:uppercase;">
          <i class="ri-pulse-line"></i> Mécanisme Thérapeutique &amp; Action Épithéliale
        </div>
        <p style="margin:0; font-size:0.85rem; color:var(--text); line-height:1.5;">
          ${esc(r.vitalistAction)}
        </p>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
          <span style="font-size:0.72rem; color:var(--text-dim); font-weight:700;">Émonctoires Ciblés :</span>
          ${r.targetEmunctories.map(e => `
            <span style="font-size:0.72rem; padding:2px 8px; border-radius:8px; background:rgba(255,255,255,0.1); color:var(--text); font-weight:600;">
              🎯 ${esc(e)}
            </span>
          `).join('')}
        </div>
      </div>

      <!-- CALCULATEUR DE PORTIONS & INGRÉDIENTS -->
      <div style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <h3 style="margin:0; font-size:1.05rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px;">
            <span>🥗</span> Ingrédients Requis
          </h3>
          <div style="display:flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:700;">
            <span style="color:var(--text-dim);">Portions :</span>
            <div style="display:inline-flex; background:var(--surface-hover); border:1px solid var(--border); border-radius:12px; padding:2px;">
              ${[1, 2, 4, 6].map(p => `
                <button 
                  type="button" 
                  style="padding:3px 10px; border-radius:10px; border:none; cursor:pointer; font-weight:800; font-size:0.78rem; background:${_currentModalServings === p ? 'var(--accent)' : 'transparent'}; color:${_currentModalServings === p ? '#fff' : 'var(--text)'};"
                  onclick="setRecipeModalServings(${p})"
                >
                  ${p} pers.
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:8px;">
          ${r.ingredients.map(ing => {
            const adjustedQty = (ing.quantity * multiplier);
            const displayQty = adjustedQty % 1 === 0 ? adjustedQty : adjustedQty.toFixed(1);
            return `
              <label style="display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:12px; background:var(--surface); border:1px solid var(--border); cursor:pointer;">
                <input type="checkbox" style="margin-top:3px; accent-color:var(--accent);">
                <div style="flex:1;">
                  <div style="font-size:0.85rem; font-weight:700; color:var(--text);">
                    <span style="color:var(--accent); font-weight:800;">${displayQty} ${esc(ing.unit)}</span> — ${esc(ing.name)}
                  </div>
                  ${ing.note ? `<div style="font-size:0.72rem; color:var(--text-dim); margin-top:2px;">${esc(ing.note)}</div>` : ''}
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <!-- ÉTAPES DE PRÉPARATION DÉTAILLÉES -->
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 12px 0; font-size:1.05rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px;">
          <span>👨‍🍳</span> Protocole de Préparation Étape par Étape
        </h3>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${r.instructions.map((step, idx) => `
            <div style="display:flex; gap:12px; padding:12px 14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
              <span style="display:flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:var(--accent); color:#fff; font-size:0.78rem; font-weight:800; flex-shrink:0;">
                ${idx + 1}
              </span>
              <p style="margin:0; font-size:0.86rem; color:var(--text); line-height:1.5;">
                ${esc(step)}
              </p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- BLOC DÉMONSTRATION VIDÉO VÉRIFIÉE -->
      ${r.videoUrl ? `
        <div class="dash-card glass" style="padding:14px 18px; margin-bottom:20px; border-radius:16px; border:1px solid rgba(239,68,68,0.3); background:linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.08)); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:12px; background:rgba(239,68,68,0.18); color:#ef4444; font-size:1.4rem; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <i class="ri-youtube-fill"></i>
            </div>
            <div>
              <div style="font-weight:800; font-size:0.9rem; color:var(--text); display:flex; align-items:center; gap:6px;">
                Démonstration Vidéo Vérifiée
                <span class="badge badge-danger" style="font-size:0.68rem; padding:1px 6px;">Tutoriel</span>
              </div>
              <div style="font-size:0.76rem; color:var(--text-dim); margin-top:2px;">
                Visionnez la préparation pas-à-pas de cette recette exacte sur YouTube.
              </div>
            </div>
          </div>
          <a href="${esc(r.videoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#ffffff; font-size:0.82rem; font-weight:700; padding:8px 18px; border-radius:12px; display:inline-flex; align-items:center; gap:6px; text-decoration:none; box-shadow:0 4px 12px rgba(239,68,68,0.3);">
            <i class="ri-play-circle-fill" style="font-size:1rem;"></i> Voir la Vidéo <i class="ri-external-link-line" style="font-size:0.8rem;"></i>
          </a>
        </div>
      ` : ''}

      <!-- BOUTONS D'ACTION RAPIDE -->
      <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; border-top:1px solid var(--border); padding-top:16px;">
        <button type="button" class="btn-secondary" onclick="copyRecipeToClipboard('${esc(r.id)}')" style="padding:10px 18px; border-radius:14px; font-weight:700; font-size:0.85rem; cursor:pointer;">
          <i class="ri-file-copy-line"></i> Copier la Recette
        </button>
        <button type="button" class="btn-primary" onclick="addRecipeToFavorites('${esc(r.id)}')" style="padding:10px 20px; border-radius:14px; font-weight:700; font-size:0.85rem; cursor:pointer;">
          <i class="ri-heart-3-fill"></i> Sauvegarder aux Favoris
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
  const recipe = VITALIST_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return;

  const text = `🍽️ ${recipe.title} (${recipe.subtitle})\n` +
    `👨‍⚕️ Auteur : ${recipe.author} — Source : ${recipe.bookReference}\n` +
    `⏱️ Préparation : ${recipe.prepTime} | Cuisson : ${recipe.cookTime} | PRAL : ${recipe.pralScore}\n\n` +
    `🥗 Ingrédients (${recipe.servings} pers.) :\n` +
    recipe.ingredients.map(i => `- ${i.quantity} ${i.unit} ${i.name} (${i.note || ''})`).join('\n') +
    `\n\n👨‍🍳 Instructions :\n` +
    recipe.instructions.map((step, idx) => `${idx + 1}. ${step}`).join('\n') +
    `\n\n🌿 Action Vitaliste : ${recipe.vitalistAction}`;

  navigator.clipboard.writeText(text).then(() => {
    if (window.showToast) {
      window.showToast("✓ Recette copiée dans le presse-papier !");
    } else {
      alert("Recette copiée dans le presse-papier !");
    }
  }).catch(() => {
    alert("Texte prêt à être copié.");
  });
}

export function addRecipeToFavorites(recipeId) {
  const recipe = VITALIST_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return;

  if (window.showToast) {
    window.showToast(`✓ "${recipe.title}" ajoutée à vos favoris !`);
  } else {
    alert(`"${recipe.title}" ajoutée à vos favoris !`);
  }
}
