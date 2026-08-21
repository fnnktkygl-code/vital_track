/**
 * bookReaderModule.js
 * 
 * Module du Lecteur e-Book Immersif (BookReader) pour VitalTrack.
 * Gère l'affichage des 26 leçons du Prof. Arnold Ehret, le sommaire,
 * les thèmes (Papier, Sépia, Nuit), la taille de police et le glossaire interactif.
 */

import { ehretMucuslessFr, ALL_READABLE_BOOKS } from './data/books/ehretMucuslessFr.js';

let _readerState = {
  isOpen: false,
  bookId: "ehret-mucusless-fr",
  chapterIndex: 0,
  theme: localStorage.getItem('vt_reader_theme') || "bone", // "bone" | "sepia" | "dusk"
  fontSize: parseInt(localStorage.getItem('vt_reader_fontsize') || "17", 10),
  sidebarOpen: window.innerWidth > 768,
  activeTerm: null
};

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
  window.setReaderTheme = setReaderTheme;
  window.adjustReaderFontSize = adjustReaderFontSize;
  window.setReaderChapter = setReaderChapter;
  window.toggleReaderSidebar = toggleReaderSidebar;
  window.showGlossaryTerm = showGlossaryTerm;
  window.closeGlossaryCard = closeGlossaryCard;

  // Clavier : Navigation Précédent/Suivant et Échap
  document.addEventListener('keydown', (e) => {
    if (!_readerState.isOpen) return;

    if (e.key === 'Escape') {
      if (_readerState.activeTerm) {
        closeGlossaryCard();
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
}

function getActiveBook() {
  return ALL_READABLE_BOOKS.find(b => b.id === _readerState.bookId) || ehretMucuslessFr;
}

export function openBookReader(bookId = "ehret-mucusless-fr", chapterIndex = null) {
  _readerState.isOpen = true;
  _readerState.bookId = bookId;
  
  if (typeof chapterIndex === 'number' && chapterIndex >= 0) {
    _readerState.chapterIndex = chapterIndex;
  } else {
    // Restaurer la dernière position sauvegardée
    const savedPos = localStorage.getItem(`vt_reader_pos_${bookId}`);
    _readerState.chapterIndex = savedPos ? parseInt(savedPos, 10) : 0;
  }

  _readerState.activeTerm = null;
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
}

export function closeBookReader() {
  _readerState.isOpen = false;
  const modal = document.getElementById('bookReaderModalOverlay');
  if (modal) {
    modal.classList.remove('open');
  }
  document.body.style.overflow = '';
}

export function setReaderTheme(theme) {
  _readerState.theme = theme;
  localStorage.setItem('vt_reader_theme', theme);
  renderReaderDOM();
}

export function adjustReaderFontSize(delta) {
  const newSize = Math.min(22, Math.max(14, _readerState.fontSize + delta));
  _readerState.fontSize = newSize;
  localStorage.setItem('vt_reader_fontsize', String(newSize));
  renderReaderDOM();
}

export function setReaderChapter(index) {
  const book = getActiveBook();
  if (!book || index < 0 || index >= book.chapters.length) return;

  _readerState.chapterIndex = index;
  _readerState.activeTerm = null;
  localStorage.setItem(`vt_reader_pos_${book.id}`, String(index));

  // Fermer la sidebar sur mobile après sélection
  if (window.innerWidth <= 768) {
    _readerState.sidebarOpen = false;
  }

  renderReaderDOM();

  // Scroll en haut du texte
  const pane = document.querySelector('.br-reading-pane');
  if (pane) pane.scrollTop = 0;
}

export function toggleReaderSidebar() {
  _readerState.sidebarOpen = !_readerState.sidebarOpen;
  renderReaderDOM();
}

export function showGlossaryTerm(term) {
  _readerState.activeTerm = term;
  renderReaderDOM();
}

export function closeGlossaryCard() {
  _readerState.activeTerm = null;
  renderReaderDOM();
}

function parseParagraphWithGlossary(text) {
  if (!text) return '';
  // 1. Parser les termes du glossaire {{terme}}
  let formatted = text.replace(/\{\{(.+?)\}\}/g, (match, term) => {
    return `<span class="br-glossary-term" onclick="showGlossaryTerm('${esc(term)}')">${esc(term)}</span>`;
  });

  // 2. Parser le markdown basique (**gras**, *italique*, newlines)
  formatted = formatted
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');

  return formatted;
}

function renderReaderDOM() {
  const modal = document.getElementById('bookReaderModalOverlay');
  if (!modal) return;

  const book = getActiveBook();
  const chapters = book.chapters || [];
  const currentChapter = chapters[_readerState.chapterIndex] || { tag: "", title: "", paragraphs: [] };
  const progressPct = Math.round(((_readerState.chapterIndex + 1) / chapters.length) * 100);
  const glossaryDef = _readerState.activeTerm && book.glossary ? (book.glossary[_readerState.activeTerm.toLowerCase()] || book.glossary[_readerState.activeTerm]) : null;

  modal.innerHTML = `
    <div class="br-root" data-theme="${_readerState.theme}">
      
      <!-- 1. TOP BAR : CONTRÔLES & THÈMES -->
      <header class="br-topbar">
        <div class="br-topbar-left">
          <button type="button" class="br-sidebar-toggle-btn" onclick="toggleReaderSidebar()" title="Afficher/Masquer le sommaire">
            <i class="${_readerState.sidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line'}"></i>
          </button>
          <span style="font-family:var(--br-font-mono); font-size:11px; font-weight:700; color:var(--br-brass); text-transform:uppercase; letter-spacing:0.5px;">
            ${esc(book.author)}
          </span>
        </div>

        <div class="br-topbar-controls">
          <!-- Sélecteur de Thèmes -->
          <div class="br-theme-group">
            <button type="button" class="br-theme-btn" data-active="${_readerState.theme === 'bone'}" onclick="setReaderTheme('bone')">Papier</button>
            <button type="button" class="br-theme-btn" data-active="${_readerState.theme === 'sepia'}" onclick="setReaderTheme('sepia')">Sépia</button>
            <button type="button" class="br-theme-btn" data-active="${_readerState.theme === 'dusk'}" onclick="setReaderTheme('dusk')">Nuit</button>
          </div>

          <!-- Zoom Typographique -->
          <div class="br-font-stepper">
            <button type="button" class="br-font-btn" onclick="adjustReaderFontSize(-1)" title="Diminuer la police">A-</button>
            <span class="br-font-label">${_readerState.fontSize}px</span>
            <button type="button" class="br-font-btn" onclick="adjustReaderFontSize(1)" title="Agrandir la police">A+</button>
          </div>

          <!-- Télécharger PDF & Fermer -->
          <a href="${book.pdfUrl}" download class="btn-secondary" style="font-size:11px; padding:4px 10px; border-radius:6px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;" title="Télécharger le PDF complet">
            <i class="ri-file-pdf-line"></i> <span class="hide-mobile">PDF</span>
          </a>

          <button type="button" class="br-close-btn" onclick="closeBookReader()" aria-label="Fermer le lecteur" title="Fermer (Échap)">
            &times;
          </button>
        </div>
      </header>

      <!-- 2. SHELL : SOMMAIRE + ZONE DE LECTURE -->
      <div class="br-shell">
        
        <!-- SOMMAIRE LATÉRAL -->
        <aside class="br-sidebar ${_readerState.sidebarOpen ? '' : 'closed'}">
          <p class="br-book-eyebrow">${esc(book.author)}</p>
          <h2 class="br-book-title">${esc(book.title)}</h2>
          <p class="br-book-meta">${esc(book.year)} · Édition Intégrale (26 Leçons)</p>

          <div class="br-progress-line">
            <div class="br-progress-track">
              <div class="br-progress-fill" style="width:${progressPct}%;"></div>
            </div>
            <span class="br-progress-label">${_readerState.chapterIndex + 1} / ${chapters.length}</span>
          </div>

          <ul class="br-chapter-list">
            ${chapters.map((c, i) => `
              <li class="br-chapter-item">
                <button type="button" class="br-chapter-btn" data-active="${i === _readerState.chapterIndex}" onclick="setReaderChapter(${i})">
                  <span class="br-chapter-tag">${esc(c.tag)}</span>
                  <span class="br-chapter-title">${esc(c.title)}</span>
                </button>
              </li>
            `).join('')}
          </ul>
        </aside>

        <!-- ZONE DE LECTURE DU TEXTE -->
        <main class="br-reading-pane" style="font-size:${_readerState.fontSize}px;">
          <article class="br-article">
            
            <div class="br-article-tag">${esc(currentChapter.tag)}</div>
            <h1 class="br-article-title">${esc(currentChapter.title)}</h1>

            <!-- CARTE GLOSSAIRE SI TERME SÉLECTIONNÉ -->
            ${glossaryDef ? `
              <div class="br-glossary-card">
                <div class="br-glossary-header">
                  <span class="br-glossary-title">💡 Définition : ${esc(_readerState.activeTerm)}</span>
                  <button type="button" class="br-glossary-close" onclick="closeGlossaryCard()">&times;</button>
                </div>
                <p class="br-glossary-desc">${esc(glossaryDef)}</p>
              </div>
            ` : ''}

            <!-- PARAGRAPHES DE LA LEÇON -->
            ${currentChapter.paragraphs && currentChapter.paragraphs.length > 0 ? (
              currentChapter.paragraphs.map((p, pIdx) => `
                <p class="br-paragraph ${pIdx === 0 ? 'first-paragraph' : ''}">
                  ${parseParagraphWithGlossary(p)}
                </p>
              `).join('')
            ) : `
              <div style="padding:40px 20px; text-align:center; color:var(--br-ink-soft); font-style:italic;">
                Cette section fait partie du sommaire étendu du livre. Le texte complet est disponible dans l'édition originale PDF.
              </div>
            `}

          </article>
        </main>
      </div>

      <!-- 3. BOTTOM BAR : NAVIGATION PRÉCÉDENT / SUIVANT -->
      <footer class="br-bottombar">
        <button type="button" class="br-nav-btn" ${_readerState.chapterIndex <= 0 ? 'disabled' : ''} onclick="setReaderChapter(${_readerState.chapterIndex - 1})">
          <i class="ri-arrow-left-s-line"></i> Précédent
        </button>

        <span class="br-progress-badge">
          ${_readerState.chapterIndex + 1} / ${chapters.length}
        </span>

        <button type="button" class="br-nav-btn" ${_readerState.chapterIndex >= chapters.length - 1 ? 'disabled' : ''} onclick="setReaderChapter(${_readerState.chapterIndex + 1})">
          Suivant <i class="ri-arrow-right-s-line"></i>
        </button>
      </footer>

    </div>
  `;
}
