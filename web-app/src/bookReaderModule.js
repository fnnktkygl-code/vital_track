/**
 * bookReaderModule.js
 * 
 * Module du Lecteur e-Book Immersif (BookReader) pour VitalTrack.
 * Gère l'affichage intégral des 26 leçons du Prof. Arnold Ehret, le sommaire,
 * les thèmes (Papier, Sépia, Nuit), la taille de police, le glossaire contextuel (popover flottant)
 * et la PERSISTANCE EXACTE DU NIVEAU DE LECTURE (mémoire de page et de scroll).
 * Totalement internationalisé via le moteur i18n (FR, EN, ES, FR-CA).
 */

import { ehretMucuslessFr, ALL_READABLE_BOOKS } from './data/books/ehretMucuslessFr.js';
import { t } from './i18n.js';

const PROGRESS_KEY_PREFIX = 'vt_book_progress_';

let _readerState = {
  isOpen: false,
  bookId: "ehret-mucusless-fr",
  chapterIndex: 0,
  theme: localStorage.getItem('vt_reader_theme') || "bone", // "bone" | "sepia" | "dusk"
  fontSize: parseInt(localStorage.getItem('vt_reader_fontsize') || "17", 10),
  sidebarOpen: window.innerWidth > 768
};

let _scrollDebounceTimer = null;

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function initBookReaderModule() {
  window.openBookReader = openBookReader;
  window.closeBookReader = closeBookReader;
  window.switchReaderBook = switchReaderBook;
  window.setReaderTheme = setReaderTheme;
  window.adjustReaderFontSize = adjustReaderFontSize;
  window.setReaderChapter = setReaderChapter;
  window.toggleReaderSidebar = toggleReaderSidebar;
  window.handleGlossaryClick = handleGlossaryClick;
  window.closeGlossaryPopover = closeGlossaryPopover;
  window.filterGlossaryCards = filterGlossaryCards;
  window.openGlossarySection = () => {
    const book = getActiveBook();
    if (book && book.chapters) {
      setReaderChapter(book.chapters.length - 1);
    }
  };

  // Clavier : Navigation Précédent/Suivant et Échap
  document.addEventListener('keydown', (e) => {
    if (!_readerState.isOpen) return;

    if (e.key === 'Escape') {
      const popover = document.getElementById('brGlossaryPopover');
      if (popover && popover.classList.contains('open')) {
        closeGlossaryPopover();
      } else {
        closeBookReader();
      }
    } else if (e.key === 'ArrowRight') {
      const book = getActiveBook();
      if (book && _readerState.chapterIndex < book.chapters.length - 1) {
        setReaderChapter(_readerState.chapterIndex + 1);
      }
    } else if (e.key === 'ArrowLeft') {
      if (_readerState.chapterIndex > 0) {
        setReaderChapter(_readerState.chapterIndex - 1);
      }
    }
  });

  // Clic extérieur pour fermer le popover de glossaire
  document.addEventListener('click', (e) => {
    if (!_readerState.isOpen) return;
    const popover = document.getElementById('brGlossaryPopover');
    if (popover && popover.classList.contains('open')) {
      if (!popover.contains(e.target) && !e.target.classList.contains('br-glossary-term')) {
        closeGlossaryPopover();
      }
    }
  });
}

function getActiveBook() {
  return ALL_READABLE_BOOKS.find(b => b.id === _readerState.bookId) || ehretMucuslessFr;
}

// ─────────────────────────────────────────────────────────────────────────────
// GESTION DE LA PERSISTANCE & MÉMOIRE DE LECTURE (EXACT SCROLL & PAGE MEMORY)
// ─────────────────────────────────────────────────────────────────────────────

export function getSavedProgress(bookId) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY_PREFIX + bookId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveReadingProgress(bookId, chapterIndex, scrollTop, scrollRatio) {
  try {
    const data = {
      bookId,
      chapterIndex,
      scrollTop: Math.round(scrollTop),
      scrollRatio: Number(scrollRatio.toFixed(3)),
      updatedAt: Date.now()
    };
    localStorage.setItem(PROGRESS_KEY_PREFIX + bookId, JSON.stringify(data));
  } catch (e) {}
}

function setupReadingScrollListener() {
  const pane = document.querySelector('.br-reading-pane');
  if (!pane) return;

  pane.addEventListener('scroll', () => {
    if (_scrollDebounceTimer) clearTimeout(_scrollDebounceTimer);
    _scrollDebounceTimer = setTimeout(() => {
      if (!_readerState.isOpen) return;
      const maxScroll = pane.scrollHeight - pane.clientHeight;
      const ratio = maxScroll > 0 ? pane.scrollTop / maxScroll : 0;
      saveReadingProgress(_readerState.bookId, _readerState.chapterIndex, pane.scrollTop, ratio);
    }, 120);
  }, { passive: true });
}

function restoreScrollPosition(targetScrollTop, showToast = false) {
  const pane = document.querySelector('.br-reading-pane');
  if (!pane) return;

  // Double requestAnimationFrame pour garantir que le DOM est complètement calculé
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pane.scrollTop = targetScrollTop || 0;
      if (showToast && targetScrollTop > 80) {
        showResumeToast();
      }
    });
  });
}

function showResumeToast() {
  const root = document.querySelector('.br-root');
  if (!root) return;

  let toast = document.getElementById('brResumeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'brResumeToast';
    toast.className = 'br-resume-toast';
    root.appendChild(toast);
  }

  const book = getActiveBook();
  const currentChapter = book.chapters[_readerState.chapterIndex];
  const chapterTag = currentChapter ? currentChapter.tag : `Section ${_readerState.chapterIndex + 1}`;

  toast.innerHTML = `
    <i class="ri-bookmark-3-fill"></i>
    <span>Reprise de lecture : <strong>${esc(chapterTag)}</strong></span>
  `;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// OUVERTURE & FERMETURE DU LECTEUR
export function openBookReader(bookId = null, chapterIndex = null) {
  _readerState.isOpen = true;
  
  const currentLang = (window.vitalTrackI18n && typeof window.vitalTrackI18n.getLanguage === 'function') 
    ? window.vitalTrackI18n.getLanguage() 
    : 'fr';

  // Smart resolution if default or generic ID is requested
  if (!bookId) {
    bookId = currentLang === 'es' ? "ehret-mucusless-es" : "ehret-mucusless-fr";
  } else if (bookId === 'ehret-mucusless-fr' && currentLang === 'es') {
    bookId = 'ehret-mucusless-es';
  } else if (bookId === 'morse-detox-miracle-fr' && currentLang === 'es') {
    bookId = 'morse-detox-miracle-es';
  }

  _readerState.bookId = bookId;

  const savedProgress = getSavedProgress(bookId);
  let targetScrollTop = 0;
  let isRestored = false;

  if (typeof chapterIndex === 'number' && chapterIndex >= 0) {
    _readerState.chapterIndex = chapterIndex;
    if (savedProgress && savedProgress.chapterIndex === chapterIndex) {
      targetScrollTop = savedProgress.scrollTop || 0;
      isRestored = targetScrollTop > 0;
    }
  } else if (savedProgress && typeof savedProgress.chapterIndex === 'number') {
    _readerState.chapterIndex = savedProgress.chapterIndex;
    targetScrollTop = savedProgress.scrollTop || 0;
    isRestored = true;
  } else {
    _readerState.chapterIndex = 0;
  }

  _readerState.sidebarOpen = window.innerWidth > 768;

  let modal = document.getElementById('bookReaderModalOverlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'bookReaderModalOverlay';
    modal.className = 'br-modal-overlay';
    modal.onclick = (e) => {
      if (e.target === modal) closeBookReader();
    };
    document.body.appendChild(modal);
  }

  document.body.style.overflow = 'hidden';
  modal.classList.add('open');
  renderReaderDOM();

  restoreScrollPosition(targetScrollTop, isRestored);
  setupReadingScrollListener();
}

export function closeBookReader() {
  _readerState.isOpen = false;
  closeGlossaryPopover();

  // Sauvegarder la position exacte lors de la fermeture
  const pane = document.querySelector('.br-reading-pane');
  if (pane) {
    const maxScroll = pane.scrollHeight - pane.clientHeight;
    const ratio = maxScroll > 0 ? pane.scrollTop / maxScroll : 0;
    saveReadingProgress(_readerState.bookId, _readerState.chapterIndex, pane.scrollTop, ratio);
  }

  const modal = document.getElementById('bookReaderModalOverlay');
  if (modal) {
    modal.classList.remove('open');
  }
  document.body.style.overflow = '';
}

export function switchReaderBook(newBookId) {
  if (newBookId === _readerState.bookId) return;

  // 1. Sauvegarder la progression du livre précédent
  const pane = document.querySelector('.br-reading-pane');
  if (pane) {
    const maxScroll = pane.scrollHeight - pane.clientHeight;
    const ratio = maxScroll > 0 ? pane.scrollTop / maxScroll : 0;
    saveReadingProgress(_readerState.bookId, _readerState.chapterIndex, pane.scrollTop, ratio);
  }

  // 2. Basculer vers le nouveau livre
  _readerState.bookId = newBookId;
  closeGlossaryPopover();

  // 3. Restaurer la progression sauvegardée du nouveau livre
  const savedProgress = getSavedProgress(newBookId);
  let targetScrollTop = 0;
  let isRestored = false;

  if (savedProgress && typeof savedProgress.chapterIndex === 'number') {
    _readerState.chapterIndex = savedProgress.chapterIndex;
    targetScrollTop = savedProgress.scrollTop || 0;
    isRestored = true;
  } else {
    _readerState.chapterIndex = 0;
  }

  renderReaderDOM();
  restoreScrollPosition(targetScrollTop, isRestored);
  setupReadingScrollListener();
}

export function setReaderTheme(theme) {
  _readerState.theme = theme;
  localStorage.setItem('vt_reader_theme', theme);
  
  const pane = document.querySelector('.br-reading-pane');
  const currentScroll = pane ? pane.scrollTop : 0;

  renderReaderDOM();
  restoreScrollPosition(currentScroll, false);
  setupReadingScrollListener();
}

export function adjustReaderFontSize(delta) {
  const newSize = Math.min(22, Math.max(14, _readerState.fontSize + delta));
  if (newSize === _readerState.fontSize) return;

  const pane = document.querySelector('.br-reading-pane');
  const maxScroll = pane ? (pane.scrollHeight - pane.clientHeight) : 0;
  const ratio = (pane && maxScroll > 0) ? (pane.scrollTop / maxScroll) : 0;

  _readerState.fontSize = newSize;
  localStorage.setItem('vt_reader_fontsize', String(newSize));
  
  renderReaderDOM();
  
  const newPane = document.querySelector('.br-reading-pane');
  if (newPane) {
    const newMax = newPane.scrollHeight - newPane.clientHeight;
    restoreScrollPosition(ratio * newMax, false);
    setupReadingScrollListener();
  }
}

export function setReaderChapter(index) {
  const book = getActiveBook();
  if (!book || index < 0 || index >= book.chapters.length) return;

  _readerState.chapterIndex = index;
  closeGlossaryPopover();
  saveReadingProgress(book.id, index, 0, 0);

  // Fermer la sidebar sur mobile après sélection
  if (window.innerWidth <= 768) {
    _readerState.sidebarOpen = false;
  }

  renderReaderDOM();
  restoreScrollPosition(0, false);
  setupReadingScrollListener();
}

export function toggleReaderSidebar() {
  _readerState.sidebarOpen = !_readerState.sidebarOpen;
  
  const pane = document.querySelector('.br-reading-pane');
  const currentScroll = pane ? pane.scrollTop : 0;

  renderReaderDOM();
  restoreScrollPosition(currentScroll, false);
  setupReadingScrollListener();
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOSSAIRE CONTEXTUEL FLOTTANT (SANS RE-RENDER NI SAUT D'ÉCRAN)
// ─────────────────────────────────────────────────────────────────────────────

export function handleGlossaryClick(event, term) {
  event.stopPropagation();
  event.preventDefault();

  const book = getActiveBook();
  const normalized = term.toLowerCase();
  const def = book.glossary ? (book.glossary[normalized] || book.glossary[term]) : null;
  if (!def) return;

  showGlossaryPopover(event.currentTarget, term, def);
}

export function showGlossaryPopover(triggerEl, term, definitionItem) {
  let popover = document.getElementById('brGlossaryPopover');
  const root = document.querySelector('.br-root');
  if (!root) return;

  if (!popover) {
    popover = document.createElement('div');
    popover.id = 'brGlossaryPopover';
    popover.className = 'br-glossary-popover';
    root.appendChild(popover);
  }

  let defText = '';
  let noteText = '';
  let noteType = 'science';
  let sources = [];

  if (typeof definitionItem === 'string') {
    defText = definitionItem;
  } else if (definitionItem && typeof definitionItem === 'object') {
    defText = definitionItem.def || '';
    noteText = definitionItem.note || '';
    noteType = definitionItem.type || 'science';
    sources = definitionItem.sources || [];
  }

  const isWarning = noteType === 'warning';

  const book = getActiveBook();

  popover.innerHTML = `
    <div class="br-popover-header">
      <div class="br-popover-title">
        <i class="ri-lightbulb-fill" style="color:var(--br-brass);"></i>
        <span style="text-transform:capitalize;">${esc(term)}</span>
      </div>
      <button type="button" class="br-popover-close" onclick="closeGlossaryPopover()" aria-label="${t('common.close')}">&times;</button>
    </div>
    <div class="br-popover-body">
      <div class="br-popover-def">
        <span class="br-popover-subheading">Théorie de ${esc(book.author)} (${esc(book.year)}) :</span>
        ${esc(defText)}
      </div>

      ${noteText ? `
        <div class="br-popover-scientific-note ${isWarning ? 'is-warning' : 'is-science'}">
          <div class="br-popover-note-title">
            <i class="${isWarning ? 'ri-alert-fill' : 'ri-scales-3-line'}"></i>
            <span>${isWarning ? 'Mise en Garde Médicale & Sécurité' : t('reader.scientificNote')}</span>
          </div>
          <p class="br-popover-note-text">${esc(noteText)}</p>

          ${sources.length > 0 ? `
            <div class="br-popover-sources">
              <span class="br-popover-sources-label"><i class="ri-book-read-line"></i> ${t('reader.academicSources')} :</span>
              <ul class="br-popover-sources-list">
                ${sources.map(s => `<li>${esc(s)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;

  // Calcul du positionnement dynamique relatif à la liseuse
  const rootRect = root.getBoundingClientRect();
  const triggerRect = triggerEl.getBoundingClientRect();

  const popoverWidth = Math.min(420, rootRect.width - 32);
  let left = (triggerRect.left - rootRect.left) + (triggerRect.width / 2) - (popoverWidth / 2);

  // Gardes-fous horizontaux
  if (left < 16) left = 16;
  if (left + popoverWidth > rootRect.width - 16) {
    left = rootRect.width - popoverWidth - 16;
  }

  // Gardes-fous verticaux (au-dessous si possible, sinon au-dessus)
  let top = (triggerRect.bottom - rootRect.top) + 10;
  const estimatedHeight = noteText ? (sources.length > 0 ? 320 : 220) : 150;
  if (top + estimatedHeight > rootRect.height - 60) {
    top = (triggerRect.top - rootRect.top) - estimatedHeight - 10;
    if (top < 55) top = 55;
  }

  popover.style.width = `${popoverWidth}px`;
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.classList.add('open');
}

export function closeGlossaryPopover() {
  const popover = document.getElementById('brGlossaryPopover');
  if (popover) {
    popover.classList.remove('open');
  }
}

export function filterGlossaryCards(query) {
  const q = (query || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.br-glossary-index-card');
  cards.forEach(card => {
    const term = card.getAttribute('data-term') || '';
    const text = card.textContent.toLowerCase();
    if (!q || term.includes(q) || text.includes(q)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function renderArticleBlock(text, pIdx) {
  if (!text) return '';

  let html = '';
  let remaining = text;

  // 1. Extraire le titre "### Titre" s'il est présent au début
  if (remaining.startsWith('### ')) {
    const lines = remaining.split('\n');
    const titleLine = lines[0].replace(/^###\s+/, '');
    html += `<h3 class="br-section-subtitle">${parseParagraphWithGlossary(titleLine)}</h3>`;
    remaining = lines.slice(1).join('\n').trim();
  }

  if (!remaining) return html;

  // 2. Si le bloc contient un organigramme / schéma (blocs ``` ... ```)
  if (remaining.includes('```')) {
    const codeMatch = remaining.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeMatch) {
      const diagramContent = codeMatch[1].trim();
      html += `<div class="br-diagram-wrap"><pre class="br-diagram-block">${esc(diagramContent)}</pre></div>`;
      const afterCode = remaining.replace(/```(?:\w+)?\n[\s\S]*?```/, '').trim();
      if (afterCode) {
        html += renderArticleBlock(afterCode, pIdx + 1);
      }
      return html;
    }
  }

  // 3. Si le reste contient un tableau Markdown
  if (remaining.includes('|') && remaining.includes('---')) {
    const lines = remaining.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
    if (lines.length >= 2) {
      html += '<div class="br-table-wrap"><table class="br-berg-table">';
      lines.forEach((line, idx) => {
        if (line.includes('---')) return; // ligne de séparation
        const rawCells = line.split('|').slice(1, -1).map(c => c.trim());
        if (idx === 0) {
          html += '<thead><tr>' + rawCells.map(c => `<th>${parseParagraphWithGlossary(c)}</th>`).join('') + '</tr></thead><tbody>';
        } else {
          html += '<tr>' + rawCells.map((c, cIdx) => {
            const cleanText = c.replace(/[\*\_]/g, '').trim();
            const isPos = cleanText.startsWith('+');
            const isNeg = cleanText.startsWith('-');
            const valClass = isPos ? 'br-val-pos' : (isNeg ? 'br-val-neg' : '');
            return `<td class="${valClass}">${parseParagraphWithGlossary(c)}</td>`;
          }).join('') + '</tr>';
        }
      });
      html += '</tbody></table></div>';
      return html;
    }
  }

  // 4. Paragraphe régulier
  return html + `<p class="br-paragraph ${pIdx === 0 ? 'first-paragraph' : ''}">${parseParagraphWithGlossary(remaining)}</p>`;
}

function parseParagraphWithGlossary(text) {
  if (!text) return '';
  // 1. Parser les termes du glossaire {{terme}}
  let formatted = text.replace(/\{\{(.+?)\}\}/g, (match, term) => {
    return `<span class="br-glossary-term" onclick="handleGlossaryClick(event, '${esc(term)}')">${esc(term)}</span>`;
  });

  // 2. Parser le markdown basique (**gras**, *italique*, newlines)
  formatted = formatted
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');

  return formatted;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDU PRINCIPAL DU DOM DU LECTEUR
// ─────────────────────────────────────────────────────────────────────────────

function renderReaderDOM() {
  const modal = document.getElementById('bookReaderModalOverlay');
  if (!modal) return;

  const existingSidebar = modal.querySelector('.br-sidebar');
  const prevSidebarScrollTop = existingSidebar ? existingSidebar.scrollTop : null;

  const book = getActiveBook();
  const chapters = book.chapters || [];
  const currentChapter = chapters[_readerState.chapterIndex] || { tag: "", title: "", paragraphs: [] };
  const progressPct = Math.round(((_readerState.chapterIndex + 1) / chapters.length) * 100);
  const glossaryEntries = Object.entries(book.glossary || {});

  modal.innerHTML = `
    <div class="br-root" data-theme="${_readerState.theme}">
      
      <!-- 1. TOP BAR : CONTRÔLES & THÈMES -->
      <header class="br-topbar">
        <div class="br-topbar-left">
          <button type="button" class="br-sidebar-toggle-btn" onclick="toggleReaderSidebar()" title="${t('reader.tableOfContents')}">
            <i class="${_readerState.sidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line'}"></i>
          </button>
          <select class="br-book-select" onchange="switchReaderBook(this.value)" aria-label="Sélectionner l'ouvrage">
            ${ALL_READABLE_BOOKS.map(b => `
              <option value="${esc(b.id)}" ${b.id === book.id ? 'selected' : ''}>
                ${b.id.includes('ehret') ? '📘' : '🌿'} ${esc(b.author)} (${esc(b.year)}) [${b.id.endsWith('-es') ? '🇪🇸 ES' : '🇫🇷 FR'}]
              </option>
            `).join('')}
          </select>
        </div>

        <div class="br-topbar-controls">
          <!-- Sélecteur de Thèmes -->
          <div class="br-theme-group">
            <button type="button" class="br-theme-btn" data-active="${_readerState.theme === 'bone'}" onclick="setReaderTheme('bone')">${t('reader.themePaper')}</button>
            <button type="button" class="br-theme-btn" data-active="${_readerState.theme === 'sepia'}" onclick="setReaderTheme('sepia')">${t('reader.themeSepia')}</button>
            <button type="button" class="br-theme-btn" data-active="${_readerState.theme === 'dusk'}" onclick="setReaderTheme('dusk')">${t('reader.themeDark')}</button>
          </div>

          <!-- Zoom Typographique -->
          <div class="br-font-stepper">
            <button type="button" class="br-font-btn" onclick="adjustReaderFontSize(-1)" title="${t('reader.fontDecrease')}">A-</button>
            <span class="br-font-label">${_readerState.fontSize}px</span>
            <button type="button" class="br-font-btn" onclick="adjustReaderFontSize(1)" title="${t('reader.fontIncrease')}">A+</button>
          </div>

          <!-- Bouton Raccourci Glossaire -->
          <button type="button" class="btn-secondary" onclick="openGlossarySection()" style="font-size:11px; padding:4px 10px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;" title="${t('reader.glossaryTab')}">
            <i class="ri-lightbulb-line"></i> <span class="hide-mobile">${t('reader.glossaryTab')} (${glossaryEntries.length})</span>
          </button>

          <!-- Télécharger PDF & Fermer -->
          <a href="${book.pdfUrl}" download class="btn-secondary" style="font-size:11px; padding:4px 10px; border-radius:6px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;" title="${t('reader.downloadPdf')}">
            <i class="ri-file-pdf-line"></i> <span class="hide-mobile">PDF</span>
          </a>

          <button type="button" class="modal-close-unified br-topbar-close-btn" onclick="closeBookReader()" aria-label="${t('reader.closeReader')}" title="${t('reader.closeReader')} (Échap)" style="position:static!important; width:32px!important; height:32px!important; font-size:18px!important;">
            <i class="ri-close-line"></i>
          </button>
        </div>
      </header>

      <!-- 2. SHELL : SOMMAIRE + ZONE DE LECTURE -->
      <div class="br-shell">
        
        <!-- SOMMAIRE LATÉRAL (320px AVEC HIERARCHIE VERTICALE) -->
        <aside class="br-sidebar ${_readerState.sidebarOpen ? '' : 'closed'}">
          <p class="br-book-eyebrow">${esc(book.author)}</p>
          <h2 class="br-book-title">${esc(book.title)}</h2>
          <p class="br-book-meta">${esc(book.year)} · Édition Intégrale (${chapters.length} Sections)</p>

          <div class="br-progress-line">
            <div class="br-progress-track">
              <div class="br-progress-fill" style="width:${progressPct}%;"></div>
            </div>
            <span class="br-progress-label">${_readerState.chapterIndex + 1} / ${chapters.length}</span>
          </div>

          <!-- Raccourci vers le Glossaire dans le Sommaire -->
          <button type="button" class="br-glossary-shortcut-btn" onclick="openGlossarySection()" style="width:100%; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; background:var(--br-moss-bg); border:1px solid var(--br-moss); color:var(--br-ink); padding:8px 12px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;">
            <span style="display:flex; align-items:center; gap:6px;"><i class="ri-lightbulb-fill" style="color:var(--br-moss);"></i> ${t('reader.glossaryTab')}</span>
            <span class="badge" style="background:var(--br-moss); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px;">${glossaryEntries.length} termes</span>
          </button>

          <ul class="br-chapter-list">
            ${chapters.map((c, i) => `
              <li class="br-chapter-item">
                <button type="button" class="br-chapter-btn" data-active="${i === _readerState.chapterIndex}" onclick="setReaderChapter(${i})">
                  <div class="br-chapter-meta-row">
                    <span class="br-chapter-tag">${esc(c.tag)}</span>
                    <span class="br-chapter-idx">#${i + 1}</span>
                  </div>
                  <span class="br-chapter-title">${esc(c.title)}</span>
                </button>
              </li>
            `).join('')}
          </ul>
        </aside>

        <!-- ZONE DE LECTURE DU TEXTE INTÉGRAL -->
        <main class="br-reading-pane" style="font-size:${_readerState.fontSize}px;">
          <article class="br-article">
            
            <div class="br-article-tag">${esc(currentChapter.tag)}</div>
            <h1 class="br-article-title">${esc(currentChapter.title)}</h1>

            <!-- VUE SPÉCIALE GLOSSAIRE INTERACTIF -->
            ${currentChapter.id.startsWith('glossaire') ? `
              <div class="br-glossary-index-container">
                <div style="margin-bottom:20px; display:flex; align-items:center; gap:10px; background:var(--br-surface); border:1px solid var(--br-line-strong); padding:10px 14px; border-radius:10px;">
                  <i class="ri-search-line" style="color:var(--br-brass); font-size:16px;"></i>
                  <input type="text" id="brGlossarySearchInput" class="br-glossary-search-input" placeholder="${t('reader.searchPlaceholder')}" oninput="filterGlossaryCards(this.value)" style="border:none; outline:none; background:transparent; font-family:var(--br-font-ui); font-size:13px; color:var(--br-ink); width:100%;" />
                </div>

                <div id="brGlossaryCardsList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(340px, 100%), 1fr)); gap:16px; margin-top:16px;">
                  ${glossaryEntries.map(([term, item]) => {
                    const defText = typeof item === 'string' ? item : (item.def || '');
                    const noteText = typeof item === 'object' ? (item.note || '') : '';
                    const isWarning = typeof item === 'object' && item.type === 'warning';
                    const sources = (typeof item === 'object' && item.sources) ? item.sources : [];
                    return `
                    <div class="br-glossary-index-card" data-term="${esc(term.toLowerCase())}">
                      <div class="br-glossary-card-header">
                        <div style="display:flex; align-items:center; gap:6px;">
                          <i class="ri-lightbulb-fill" style="color:var(--br-brass); font-size:14px;"></i>
                          <h4 class="br-glossary-card-title">${esc(term)}</h4>
                        </div>
                        ${isWarning ? `
                          <span class="br-badge-warning-pill"><i class="ri-alert-fill"></i> Mise en Garde</span>
                        ` : (noteText ? `
                          <span class="br-badge-science-pill"><i class="ri-scales-3-line"></i> ${t('reader.scientificNote')}</span>
                        ` : '')}
                      </div>

                      <p class="br-glossary-card-def">
                        <strong style="color:var(--br-brass); font-size:11px; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Théorie de ${esc(book.author)} (${esc(book.year)}) :</strong>
                        ${esc(defText)}
                      </p>

                      ${noteText ? `
                        <div class="br-glossary-card-note ${isWarning ? 'is-warning' : 'is-science'}">
                          <div class="br-glossary-note-header">
                            <i class="${isWarning ? 'ri-alert-fill' : 'ri-scales-3-line'}"></i>
                            <span>${isWarning ? 'Mise en Garde Médicale & Sécurité' : t('reader.scientificNote')}</span>
                          </div>
                          <p class="br-glossary-note-body">${esc(noteText)}</p>

                          ${sources.length > 0 ? `
                            <div class="br-glossary-card-sources">
                              <span class="br-sources-label"><i class="ri-book-open-line"></i> ${t('reader.academicSources')} :</span>
                              <ul class="br-sources-list">
                                ${sources.map(s => `<li>${esc(s)}</li>`).join('')}
                              </ul>
                            </div>
                          ` : ''}
                        </div>
                      ` : ''}
                    </div>
                  `;
                  }).join('')}
                </div>
              </div>
            ` : (
              currentChapter.paragraphs && currentChapter.paragraphs.length > 0 ? (
                currentChapter.paragraphs.map((p, pIdx) => renderArticleBlock(p, pIdx)).join('')
              ) : `
                <div style="padding:40px 20px; text-align:center; color:var(--br-ink-soft); font-style:italic;">
                  Cette section fait partie du sommaire étendu du livre. Le texte complet est disponible dans l'édition originale PDF.
                </div>
              `
            )}

          </article>
        </main>
      </div>

      <!-- 3. BOTTOM BAR : NAVIGATION PRÉCÉDENT / SUIVANT -->
      <footer class="br-bottombar">
        <button type="button" class="br-nav-btn" ${_readerState.chapterIndex <= 0 ? 'disabled' : ''} onclick="setReaderChapter(${_readerState.chapterIndex - 1})">
          <i class="ri-arrow-left-s-line"></i> ${t('reader.prevChapter')}
        </button>

        <span class="br-progress-badge">
          ${_readerState.chapterIndex + 1} / ${chapters.length}
        </span>

        <button type="button" class="br-nav-btn" ${_readerState.chapterIndex >= chapters.length - 1 ? 'disabled' : ''} onclick="setReaderChapter(${_readerState.chapterIndex + 1})">
          ${t('reader.nextChapter')} <i class="ri-arrow-right-s-line"></i>
        </button>
      </footer>

    </div>
  `;

  // Restaurer le scroll du sommaire latéral pour éviter tout saut intempestif vers le haut
  const newSidebar = modal.querySelector('.br-sidebar');
  if (newSidebar) {
    if (typeof prevSidebarScrollTop === 'number' && prevSidebarScrollTop > 0) {
      newSidebar.scrollTop = prevSidebarScrollTop;
    }
    const activeBtn = newSidebar.querySelector('.br-chapter-btn[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  }
}
