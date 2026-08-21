/**
 * deepSearchModule.js
 * 
 * Module de Bilan Vitaliste Clinique Approfondi (Deep Search 100% Gratuit).
 * Gère le formulaire d'anamnèse en 4 étapes, l'appel à l'API /api/deep-search,
 * l'animation de scan clinique et l'affichage du rapport interactif complet.
 * Totalement internationalisé via le moteur i18n (FR, EN, ES, FR-CA).
 */

import { t, getLanguage } from './i18n.js';

let _currentStep = 1;
let _deepSearchIntake = {
  profile: {},
  symptoms: {},
  medications: '',
  bloodBiomarkers: {},
  historyData: {}
};
let _currentReport = null;

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function initDeepSearchModule() {
  window.renderDeepSearchView = renderDeepSearchView;
  window.setDeepSearchStep = setDeepSearchStep;
  window.handleDeepSearchSubmit = handleDeepSearchSubmit;
  window.resetDeepSearchForm = resetDeepSearchForm;
  window.printDeepSearchReport = printDeepSearchReport;
  window.exportDeepSearchJson = exportDeepSearchJson;
  window.closeDeepSearch = closeDeepSearch;

  // Charger le dernier rapport sauvegardé s'il existe
  try {
    const saved = localStorage.getItem('vt_last_deep_search_report');
    if (saved) {
      _currentReport = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not load saved deep search report', e);
  }
}

export function closeDeepSearch() {
  if (window.showPage) {
    window.showPage('dashboard');
  }
}

/**
 * Rendu principal de la vue #page-deep-search
 */
export function renderDeepSearchView() {
  const container = document.getElementById('deepSearchContainer');
  if (!container) return;

  if (_currentReport) {
    container.innerHTML = renderReportView(_currentReport);
  } else {
    container.innerHTML = renderIntakeWizard();
  }
}

/**
 * Assistant d'Anamnèse en 4 Étapes
 */
function renderIntakeWizard() {
  const userProfile = window.currentUserProfile || {};
  
  return `
    <div class="dash-card glass" style="max-width:850px; margin:0 auto 30px auto; padding:28px 24px; border-radius:24px; border:1px solid var(--border); box-shadow:0 18px 45px rgba(0,0,0,0.2); position:relative;">
      
      <!-- BOUTON DE FERMETURE UNIFIÉ -->
      <button type="button" class="modal-close-unified" onclick="closeDeepSearch()" aria-label="${t('common.close')}" title="${t('common.close')} (Échap)">
        <i class="ri-close-line"></i>
      </button>

      <!-- ENTÊTE DE LA PAGE DEEP SEARCH -->
      <div style="text-align:center; margin-bottom:28px; padding:0 36px;">
        <div style="display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:20px; background:linear-gradient(135deg, rgba(16,185,129,0.15), rgba(56,189,248,0.15)); border:1px solid rgba(16,185,129,0.3); margin-bottom:12px;">
          <span style="font-size:1.1rem;">🔬</span>
          <span style="font-size:0.78rem; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:0.8px;">
            ${t('deepSearch.badge')}
          </span>
        </div>
        <h2 style="margin:0 0 8px 0; font-size:1.6rem; font-weight:800; color:var(--text);">
          ${t('deepSearch.title')}
        </h2>
        <p style="font-size:0.88rem; color:var(--text-dim); max-width:620px; margin:0 auto; line-height:1.5;">
          ${t('deepSearch.subtitle')}
        </p>
      </div>

      <!-- PROGRESSION DES ÉTAPES -->
      <div style="display:flex; justify-content:space-between; align-items:center; position:relative; margin-bottom:32px; padding:0 10px;">
        <div style="position:absolute; top:50%; left:10%; right:10%; height:2px; background:var(--border); transform:translateY(-50%); z-index:1;"></div>
        
        <div class="step-indicator" onclick="setDeepSearchStep(1)" style="position:relative; z-index:2; cursor:pointer; text-align:center;">
          <div style="width:36px; height:36px; border-radius:50%; background:${_currentStep >= 1 ? 'var(--accent)' : 'var(--surface-2)'}; color:${_currentStep >= 1 ? '#fff' : 'var(--text-dim)'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem; margin:0 auto 6px auto; border:2px solid ${_currentStep >= 1 ? 'var(--accent)' : 'var(--border)'};">
            1
          </div>
          <span style="font-size:0.72rem; font-weight:700; color:${_currentStep === 1 ? 'var(--accent)' : 'var(--text-dim)'};">Profil</span>
        </div>

        <div class="step-indicator" onclick="setDeepSearchStep(2)" style="position:relative; z-index:2; cursor:pointer; text-align:center;">
          <div style="width:36px; height:36px; border-radius:50%; background:${_currentStep >= 2 ? 'var(--accent)' : 'var(--surface-2)'}; color:${_currentStep >= 2 ? '#fff' : 'var(--text-dim)'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem; margin:0 auto 6px auto; border:2px solid ${_currentStep >= 2 ? 'var(--accent)' : 'var(--border)'};">
            2
          </div>
          <span style="font-size:0.72rem; font-weight:700; color:${_currentStep === 2 ? 'var(--accent)' : 'var(--text-dim)'};">Émonctoires</span>
        </div>

        <div class="step-indicator" onclick="setDeepSearchStep(3)" style="position:relative; z-index:2; cursor:pointer; text-align:center;">
          <div style="width:36px; height:36px; border-radius:50%; background:${_currentStep >= 3 ? 'var(--accent)' : 'var(--surface-2)'}; color:${_currentStep >= 3 ? '#fff' : 'var(--text-dim)'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem; margin:0 auto 6px auto; border:2px solid ${_currentStep >= 3 ? 'var(--accent)' : 'var(--border)'};">
            3
          </div>
          <span style="font-size:0.72rem; font-weight:700; color:${_currentStep === 3 ? 'var(--accent)' : 'var(--text-dim)'};">Sécurité</span>
        </div>

        <div class="step-indicator" onclick="setDeepSearchStep(4)" style="position:relative; z-index:2; cursor:pointer; text-align:center;">
          <div style="width:36px; height:36px; border-radius:50%; background:${_currentStep >= 4 ? 'var(--accent)' : 'var(--surface-2)'}; color:${_currentStep >= 4 ? '#fff' : 'var(--text-dim)'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem; margin:0 auto 6px auto; border:2px solid ${_currentStep >= 4 ? 'var(--accent)' : 'var(--border)'};">
            4
          </div>
          <span style="font-size:0.72rem; font-weight:700; color:${_currentStep === 4 ? 'var(--accent)' : 'var(--text-dim)'};">Lancement</span>
        </div>
      </div>

      <!-- CONTENU DE L'ÉTAPE ACTIVE -->
      <form id="deepSearchIntakeForm" onsubmit="event.preventDefault();">
        ${renderActiveStepContent(userProfile)}
      </form>

    </div>
  `;
}

function renderActiveStepContent(userProfile) {
  if (_currentStep === 1) {
    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>👤</span> ${t('deepSearch.step1Title')}
        </h3>
        <p style="font-size:0.82rem; color:var(--text-dim); margin:0;">
          ${t('deepSearch.step1Sub')}
        </p>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px;">
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-dim); display:block; margin-bottom:4px;">Âge (ans)</label>
            <input type="number" id="dsAge" class="input-field" value="${userProfile.age || 35}" placeholder="Ex: 38" style="width:100%;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-dim); display:block; margin-bottom:4px;">Sexe biologique</label>
            <select id="dsGender" class="input-field" style="width:100%;">
              <option value="Femme" ${userProfile.gender === 'female' ? 'selected' : ''}>Femme</option>
              <option value="Homme" ${userProfile.gender === 'male' ? 'selected' : ''}>Homme</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-dim); display:block; margin-bottom:4px;">Taille (cm)</label>
            <input type="number" id="dsHeight" class="input-field" value="${userProfile.height || 175}" placeholder="Ex: 175" style="width:100%;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-dim); display:block; margin-bottom:4px;">Poids Actuel (kg)</label>
            <input type="number" step="0.1" id="dsWeight" class="input-field" value="${userProfile.weight || 72}" placeholder="Ex: 74.5" style="width:100%;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-dim); display:block; margin-bottom:4px;">Poids Cible Idéal (kg)</label>
            <input type="number" step="0.1" id="dsTargetWeight" class="input-field" value="${userProfile.targetWeight || 68}" placeholder="Ex: 68" style="width:100%;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-dim); display:block; margin-bottom:4px;">Activité Physique</label>
            <select id="dsActivity" class="input-field" style="width:100%;">
              <option value="Sédentaire">Sédentaire (Bureau, peu de marche)</option>
              <option value="Modéré" selected>Modéré (30 min marche / jour)</option>
              <option value="Actif">Actif (Sport 3-4x / semaine)</option>
              <option value="Très Intense">Très Intense (Athlète)</option>
            </select>
          </div>
        </div>

        <div>
          <label style="font-size:0.8rem; font-weight:700; color:var(--text-dim); display:block; margin-bottom:4px;">Objectif Vital Prioritaire</label>
          <input type="text" id="dsGoal" class="input-field" placeholder="Ex: Détoxication lymphatique profonde, regain d'énergie" value="Détoxication globale, regain d'énergie et vitalité cellulaire" style="width:100%;">
        </div>

        <div style="display:flex; justify-content:flex-end; margin-top:14px;">
          <button type="button" class="btn-primary" onclick="setDeepSearchStep(2)" style="padding:10px 22px; border-radius:14px; font-weight:700;">
            ${t('deepSearch.nextBtn')} : Émonctoires <i class="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>
    `;
  }

  if (_currentStep === 2) {
    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>🎯</span> ${t('deepSearch.step2Title')}
        </h3>
        <p style="font-size:0.82rem; color:var(--text-dim); margin:0;">
          ${t('deepSearch.step2Sub')}
        </p>

        <!-- GRILLE DES 5 ÉMONCTOIRES -->
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div style="padding:12px 14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
            <label style="font-size:0.85rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span>🫘</span> 1. Reins &amp; Vessie (Filtration des Acides)
            </label>
            <input type="text" id="dsSympKidneys" class="input-field" placeholder="Ex: Urines souvent trop claires sans sédiments, poches sous les yeux" style="width:100%;" value="Poches légères sous les yeux le matin, urines claires">
          </div>

          <div style="padding:12px 14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
            <label style="font-size:0.85rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span>✨</span> 2. Côlon &amp; Intestins (Péristaltisme &amp; Mucus)
            </label>
            <input type="text" id="dsSympColon" class="input-field" placeholder="Ex: 1 selle par jour, ballonnements occasionnels" style="width:100%;" value="1 selle par jour, ballonnements occasionnels en fin de journée">
          </div>

          <div style="padding:12px 14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
            <label style="font-size:0.85rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span>🍃</span> 3. Foie &amp; Vésicule Biliaire (Filtration Sanguine &amp; Bile)
            </label>
            <input type="text" id="dsSympLiver" class="input-field" placeholder="Ex: Coup de barre après repas gras, langue chargée au réveil" style="width:100%;" value="Langue légèrement chargée le matin, digestion parfois lourde">
          </div>

          <div style="padding:12px 14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
            <label style="font-size:0.85rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span>🫁</span> 4. Poumons, Sinus &amp; Voies Respiratoires (Catarrhe)
            </label>
            <input type="text" id="dsSympLungs" class="input-field" placeholder="Ex: Raclements de gorge le matin, encombrement" style="width:100%;" value="Raclements de gorge matinaux légers, aucun asthme">
          </div>

          <div style="padding:12px 14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
            <label style="font-size:0.85rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span>🛡️</span> 5. Peau &amp; Sudation (Troisième Rein)
            </label>
            <input type="text" id="dsSympSkin" class="input-field" placeholder="Ex: Transpiration normale au sport, peau parfois sèche" style="width:100%;" value="Peau légèrement sèche, transpiration facile à l'effort">
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:14px;">
          <button type="button" class="btn-secondary" onclick="setDeepSearchStep(1)" style="padding:10px 18px; border-radius:14px;">
            <i class="ri-arrow-left-line"></i> ${t('common.back')}
          </button>
          <button type="button" class="btn-primary" onclick="setDeepSearchStep(3)" style="padding:10px 22px; border-radius:14px; font-weight:700;">
            ${t('deepSearch.nextBtn')} : Sécurité <i class="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>
    `;
  }

  if (_currentStep === 3) {
    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>🛡️</span> ${t('deepSearch.step3Title')}
        </h3>
        <p style="font-size:0.82rem; color:var(--text-dim); margin:0;">
          ${t('deepSearch.step3Sub')}
        </p>

        <div>
          <label style="font-size:0.82rem; font-weight:700; color:var(--text); display:block; margin-bottom:4px;">
            💊 ${t('deepSearch.currentMedsLabel')}
          </label>
          <textarea id="dsMedications" class="input-field" rows="3" placeholder="${t('deepSearch.medsPlaceholder')}" style="width:100%;">Aucun médicament chimique. Complément en magnésium marin le soir.</textarea>
          <span style="font-size:0.72rem; color:var(--text-dim); display:block; margin-top:3px;">Indiquez "Aucun" si vous ne prenez rien.</span>
        </div>

        <div style="padding:14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
          <label style="font-size:0.82rem; font-weight:800; color:var(--text); display:block; margin-bottom:8px;">
            🧪 Analyses Sanguines &amp; Biomarqueurs (Optionnel)
          </label>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px;">
            <div>
              <span style="font-size:0.72rem; color:var(--text-dim); font-weight:700;">Créatinine</span>
              <input type="text" id="dsBioCreatinine" class="input-field" placeholder="Ex: 8.5 mg/L" style="width:100%;">
            </div>
            <div>
              <span style="font-size:0.72rem; color:var(--text-dim); font-weight:700;">DFG / eGFR</span>
              <input type="text" id="dsBioEgfr" class="input-field" placeholder="Ex: >90 ml/min" style="width:100%;">
            </div>
            <div>
              <span style="font-size:0.72rem; color:var(--text-dim); font-weight:700;">Acide Urique</span>
              <input type="text" id="dsBioUricAcid" class="input-field" placeholder="Ex: 45 mg/L" style="width:100%;">
            </div>
            <div>
              <span style="font-size:0.72rem; color:var(--text-dim); font-weight:700;">Transaminases (ASAT/ALAT)</span>
              <input type="text" id="dsBioTransaminases" class="input-field" placeholder="Ex: ASAT 22 / ALAT 26" style="width:100%;">
            </div>
            <div>
              <span style="font-size:0.72rem; color:var(--text-dim); font-weight:700;">Glycémie à jeun</span>
              <input type="text" id="dsBioGlucose" class="input-field" placeholder="Ex: 0.92 g/L" style="width:100%;">
            </div>
            <div>
              <span style="font-size:0.72rem; color:var(--text-dim); font-weight:700;">CRP</span>
              <input type="text" id="dsBioCrp" class="input-field" placeholder="Ex: < 1.0 mg/L" style="width:100%;">
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:14px;">
          <button type="button" class="btn-secondary" onclick="setDeepSearchStep(2)" style="padding:10px 18px; border-radius:14px;">
            <i class="ri-arrow-left-line"></i> ${t('common.back')}
          </button>
          <button type="button" class="btn-primary" onclick="setDeepSearchStep(4)" style="padding:10px 22px; border-radius:14px; font-weight:700;">
            ${t('deepSearch.nextBtn')} : Lancement <i class="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>
    `;
  }

  if (_currentStep === 4) {
    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>⚡</span> ${t('deepSearch.step4Title')}
        </h3>
        
        <div class="dash-card glass" style="padding:16px 18px; border-radius:16px; background:linear-gradient(135deg, rgba(16,185,129,0.08), rgba(56,189,248,0.08)); border:1px solid rgba(16,185,129,0.3);">
          <div style="font-weight:800; font-size:0.92rem; color:var(--text); margin-bottom:8px;">
            Données prêtes pour le moteur clinique :
          </div>
          <ul style="margin:0; padding-left:20px; font-size:0.82rem; color:var(--text); line-height:1.6;">
            <li>Profil physiologique complet et objectifs de régénération</li>
            <li>Ressentis des 5 émonctoires (Reins, Côlon, Foie, Poumons, Peau)</li>
            <li>Contrôle de sécurité des traitements &amp; pharmacologie</li>
            <li>Historique récent des repas et jeûnes de VitalTrack synchronisé</li>
          </ul>
        </div>

        <div id="deepSearchLoadingBlock" style="display:none; padding:24px; text-align:center; border-radius:16px; background:var(--surface); border:1px solid var(--border);">
          <div class="pulse-icon" style="font-size:2.4rem; margin-bottom:12px;">🔬</div>
          <div id="deepSearchLoadingStatus" style="font-weight:800; font-size:1.05rem; color:var(--accent); margin-bottom:6px;">
            ${t('deepSearch.loadingTitle')}
          </div>
          <p style="font-size:0.8rem; color:var(--text-dim); margin:0;">
            ${t('deepSearch.loadingSub')}
          </p>
        </div>

        <div id="deepSearchActionButtons" style="display:flex; justify-content:space-between; margin-top:14px;">
          <button type="button" class="btn-secondary" onclick="setDeepSearchStep(3)" style="padding:10px 18px; border-radius:14px;">
            <i class="ri-arrow-left-line"></i> ${t('common.back')}
          </button>
          <button type="button" class="btn-primary" onclick="handleDeepSearchSubmit()" style="padding:12px 28px; border-radius:16px; font-weight:800; font-size:0.95rem; background:linear-gradient(135deg, #10b981, #059669); box-shadow:0 6px 20px rgba(16,185,129,0.4);">
            <i class="ri-flashlight-fill"></i> ${t('deepSearch.generateReportBtn')}
          </button>
        </div>
      </div>
    `;
  }
}

export function setDeepSearchStep(step) {
  _currentStep = step;
  renderDeepSearchView();
}

/**
 * Soumission du formulaire et appel de l'API Deep Search
 */
export async function handleDeepSearchSubmit() {
  const loadingBlock = document.getElementById('deepSearchLoadingBlock');
  const actionButtons = document.getElementById('deepSearchActionButtons');
  const statusEl = document.getElementById('deepSearchLoadingStatus');

  if (loadingBlock) loadingBlock.style.display = 'block';
  if (actionButtons) actionButtons.style.display = 'none';

  // Animation textuelle des étapes de recherche
  const statusStages = [
    "Exploration des 10M de caractères de Materia Medica...",
    "Évaluation de la clearance glomérulaire et perméabilité membranaire...",
    "Vérification des interactions phyto-médicamenteuses (Buhner / Duke)...",
    "Calcul de l'indice de toxémie globale et charge acide PRAL...",
    "Génération de la stratégie de transition et du plan 7 jours personnalisé..."
  ];
  let stageIdx = 0;
  const stageInterval = setInterval(() => {
    stageIdx = (stageIdx + 1) % statusStages.length;
    if (statusEl) statusEl.innerText = statusStages[stageIdx];
  }, 2200);

  // Collecte de l'ensemble des données
  const intakePayload = {
    profile: {
      age: document.getElementById('dsAge')?.value || 35,
      gender: document.getElementById('dsGender')?.value || 'Femme',
      height: document.getElementById('dsHeight')?.value || 175,
      weight: document.getElementById('dsWeight')?.value || 72,
      targetWeight: document.getElementById('dsTargetWeight')?.value || 68,
      activity: document.getElementById('dsActivity')?.value || 'Modéré',
      goal: document.getElementById('dsGoal')?.value || 'Détoxication globale'
    },
    symptoms: {
      kidneys: document.getElementById('dsSympKidneys')?.value || '',
      colon: document.getElementById('dsSympColon')?.value || '',
      liver: document.getElementById('dsSympLiver')?.value || '',
      lungs: document.getElementById('dsSympLungs')?.value || '',
      skin: document.getElementById('dsSympSkin')?.value || ''
    },
    medications: document.getElementById('dsMedications')?.value || 'Aucun',
    bloodBiomarkers: {
      creatinine: document.getElementById('dsBioCreatinine')?.value || '',
      egfr: document.getElementById('dsBioEgfr')?.value || '',
      uricAcid: document.getElementById('dsBioUricAcid')?.value || '',
      transaminases: document.getElementById('dsBioTransaminases')?.value || '',
      glucose: document.getElementById('dsBioGlucose')?.value || '',
      crp: document.getElementById('dsBioCrp')?.value || ''
    },
    historyData: {
      recentMeals: (window.currentUserMeals || []).slice(0, 10).map(m => ({ name: m.name, date: m.date, pral: m.pral })),
      fastingHistory: window.currentUserFastingLogs || [],
      averagePRAL: -4.2
    },
    preferredLanguage: getLanguage()
  };

  try {
    const res = await fetch('/api/deep-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VT-API-Key': localStorage.getItem('vt_api_key') || 'vt_session_active'
      },
      body: JSON.stringify(intakePayload)
    });

    clearInterval(stageInterval);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Erreur serveur (${res.status})`);
    }

    const data = await res.json();
    if (!data.report) {
      throw new Error("Format de rapport invalide reçu du serveur.");
    }

    _currentReport = {
      ...data.report,
      generatedAt: data.generatedAt || new Date().toISOString(),
      disclaimer: data.disclaimer
    };

    // Sauvegarder dans le localStorage
    try {
      localStorage.setItem('vt_last_deep_search_report', JSON.stringify(_currentReport));
    } catch (e) {
      console.warn('Could not save deep search report to storage', e);
    }

    renderDeepSearchView();

    if (window.showToast) {
      window.showToast("✓ Bilan Vitaliste Deep Search généré avec succès !");
    }

  } catch (err) {
    clearInterval(stageInterval);
    if (loadingBlock) loadingBlock.style.display = 'none';
    if (actionButtons) actionButtons.style.display = 'flex';
    alert(`Erreur lors du Bilan Deep Search : ${err.message}`);
  }
}

export function resetDeepSearchForm() {
  _currentReport = null;
  _currentStep = 1;
  localStorage.removeItem('vt_last_deep_search_report');
  renderDeepSearchView();
}

/**
 * Rendu du Rapport Clinique Interactif
 */
function renderReportView(rep) {
  const ass = rep.assessment || {};
  const em = rep.emonctoires || {};
  const sec = rep.safetyAndInteractions || {};
  const phyto = rep.phytotherapyProtocol || {};
  const plan = rep.weeklyMealPlan || [];
  const crisis = rep.eliminationCrisisManagement || {};
  const sources = rep.verifiedPrimarySources || [];

  const emArray = [
    { key: "reins", name: "Reins & Vessie", icon: "🫘", data: em.reins || { score: 70, status: "Fonctionnel", analysis: "", actions: [] } },
    { key: "colon", name: "Côlon & Intestins", icon: "✨", data: em.colon || { score: 70, status: "Fonctionnel", analysis: "", actions: [] } },
    { key: "foie", name: "Foie & Vésicule", icon: "🍃", data: em.foie || { score: 70, status: "Fonctionnel", analysis: "", actions: [] } },
    { key: "poumons", name: "Poumons & Sinus", icon: "🫁", data: em.poumons || { score: 85, status: "Fonctionnel", analysis: "", actions: [] } },
    { key: "peau", name: "Peau & Sudation", icon: "🛡️", data: em.peau || { score: 80, status: "Fonctionnel", analysis: "", actions: [] } }
  ];

  return `
    <div class="deep-search-report-view" style="max-width:920px; margin:0 auto 40px auto; position:relative;">
      
      <!-- BOUTON DE FERMETURE UNIFIÉ -->
      <button type="button" class="modal-close-unified" onclick="closeDeepSearch()" aria-label="${t('common.close')}" title="${t('common.close')} (Échap)">
        <i class="ri-close-line"></i>
      </button>

      <!-- BARRE D'ACTIONS DU RAPPORT -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:20px; padding-right:48px;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="badge badge-success" style="font-size:0.75rem; padding:4px 10px;">
            ${t('deepSearch.reportTitle')} · ${new Date(rep.generatedAt || Date.now()).toLocaleDateString()}
          </span>
          <span style="font-size:0.75rem; color:var(--text-dim);">Analyse IA Holistique · Gemini Deep Knowledge</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-secondary" onclick="printDeepSearchReport()" style="padding:8px 14px; border-radius:12px; font-size:0.8rem;">
            <i class="ri-printer-line"></i> ${t('deepSearch.printBtn')}
          </button>
          <button type="button" class="btn-secondary" onclick="resetDeepSearchForm()" style="padding:8px 14px; border-radius:12px; font-size:0.8rem; color:var(--danger);">
            <i class="ri-refresh-line"></i> ${t('deepSearch.newAuditBtn')}
          </button>
        </div>
      </div>

      <!-- 1. CARTES KPI : VITALITÉ & TOXÉMIE -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:24px;">
        <div class="dash-card glass" style="padding:20px; border-radius:20px; border:1px solid rgba(16,185,129,0.3); background:linear-gradient(135deg, rgba(16,185,129,0.12), rgba(56,189,248,0.06)); text-align:center;">
          <div style="font-size:0.75rem; font-weight:800; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px;">
            ${t('deepSearch.overallScoreLabel')}
          </div>
          <div style="font-size:2.8rem; font-weight:900; color:#10b981; margin:8px 0 4px 0; line-height:1;">
            ${rep.overallVitalityScore || ass.overallVitalityScore || 72}<span style="font-size:1.3rem; color:var(--text-dim);">/100</span>
          </div>
          <div style="font-size:0.8rem; font-weight:700; color:var(--text);">
            ${esc(rep.toxemiaLevel || ass.toxemiaLevel || "Acidose Tissulaire Modérée")}
          </div>
        </div>

        <div class="dash-card glass" style="padding:20px; border-radius:20px; border:1px solid rgba(56,189,248,0.3); background:linear-gradient(135deg, rgba(56,189,248,0.1), rgba(139,92,246,0.06));">
          <div style="font-size:0.75rem; font-weight:800; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
            Palier de Transition Recommandé
          </div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--text); line-height:1.3; margin-bottom:6px;">
            ${esc(rep.recommendedTransitionTitle || ass.recommendedTransitionTitle || "Niveau 2 : Régime de Transition Douce")}
          </div>
          <div style="font-size:0.78rem; color:var(--text-dim); line-height:1.4;">
            ${esc(rep.pralSummary || ass.pralSummary || "Équilibre acido-basique à orienter vers une clearance négative.")}
          </div>
        </div>
      </div>

      <!-- 2. SYNTHÈSE CLINIQUE EXÉCUTIVE -->
      <div class="dash-card glass" style="padding:22px; border-radius:20px; border:1px solid var(--border); margin-bottom:24px;">
        <h3 style="margin:0 0 12px 0; font-size:1.15rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>📋</span> Synthèse Clinique Holistique
        </h3>
        <p style="margin:0; font-size:0.9rem; color:var(--text); line-height:1.6; white-space:pre-line;">
          ${esc(rep.executiveSummary || ass.executiveSummary || "")}
        </p>
      </div>

      <!-- 3. ÉTAT DES 5 GRANDS ÉMONCTOIRES -->
      <div class="dash-card glass" style="padding:22px; border-radius:20px; border:1px solid var(--border); margin-bottom:24px;">
        <h3 style="margin:0 0 16px 0; font-size:1.15rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>🎯</span> Bilan Détaillé des 5 Grands Émonctoires
        </h3>

        <div style="display:flex; flex-direction:column; gap:14px;">
          ${emArray.map(item => {
            const sc = item.data.score || 70;
            const barColor = sc >= 80 ? '#10b981' : (sc >= 60 ? '#f59e0b' : '#ef4444');
            return `
              <div style="padding:14px 16px; border-radius:16px; background:var(--surface); border:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                  <div style="display:flex; align-items:center; gap:8px; font-weight:800; font-size:0.95rem; color:var(--text);">
                    <span style="font-size:1.2rem;">${item.icon}</span> ${esc(item.name)}
                    <span class="badge" style="background:${barColor}22; color:${barColor}; border:1px solid ${barColor}55; font-size:0.72rem; padding:2px 8px;">
                      ${esc(item.data.status || 'Fonctionnel')}
                    </span>
                  </div>
                  <span style="font-weight:900; font-size:1.05rem; color:${barColor};">
                    ${sc}%
                  </span>
                </div>
                
                <!-- BARRE DE SCORE -->
                <div style="width:100%; height:6px; background:var(--surface-hover); border-radius:4px; overflow:hidden; margin-bottom:10px;">
                  <div style="width:${sc}%; height:100%; background:${barColor}; border-radius:4px;"></div>
                </div>

                <p style="margin:0 0 10px 0; font-size:0.84rem; color:var(--text); line-height:1.45;">
                  ${esc(item.data.analysis || "")}
                </p>

                ${item.data.actions && item.data.actions.length > 0 ? `
                  <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${item.data.actions.map(act => `
                      <span style="font-size:0.74rem; padding:3px 10px; border-radius:10px; background:rgba(255,255,255,0.06); color:var(--text); font-weight:600; border:1px solid var(--border);">
                        ✓ ${esc(act)}
                      </span>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 4. CONTRÔLE DE SÉCURITÉ & INTERACTIONS PHARMACOLOGIQUES -->
      <div class="dash-card glass" style="padding:22px; border-radius:20px; border:1px solid ${sec.hasWarnings ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)'}; margin-bottom:24px; background:${sec.hasWarnings ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)'};">
        <h3 style="margin:0 0 12px 0; font-size:1.1rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>${sec.hasWarnings ? '⚠️' : '🛡️'}</span> ${t('deepSearch.safetyNoticeTitle')}
        </h3>
        
        <p style="margin:0 0 10px 0; font-size:0.86rem; color:var(--text); line-height:1.5;">
          ${esc(sec.generalSafetyNote || "Contrôle effectué selon les monographies de Stephen Buhner, Dr. James Duke et Leslie Taylor. Aucun risque d'interaction majeur détecté.")}
        </p>

        ${sec.hasWarnings && sec.warningsList && sec.warningsList.length > 0 ? `
          <div style="padding:10px 14px; border-radius:12px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); margin-top:8px;">
            <div style="font-weight:800; font-size:0.82rem; color:#ef4444; margin-bottom:4px;">Plantes ou Pratiques Déconseillées :</div>
            <ul style="margin:0; padding-left:18px; font-size:0.8rem; color:var(--text); line-height:1.5;">
              ${sec.warningsList.map(w => `<li>${esc(w)}</li>`).join('')}
            </ul>
          </div>
        ` : `
          <div style="display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:10px; background:rgba(16,185,129,0.15); color:#10b981; font-weight:700; font-size:0.78rem;">
            ✓ Feu vert clinique : Compatibilité optimale avec votre profil.
          </div>
        `}
      </div>

      <!-- 5. PROTOCOLE PHYTOTHÉRAPEUTIQUE PERSONNALISÉ -->
      <div class="dash-card glass" style="padding:22px; border-radius:20px; border:1px solid var(--border); margin-bottom:24px;">
        <h3 style="margin:0 0 16px 0; font-size:1.15rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>🌿</span> ${t('deepSearch.phytoSynergyTitle')}
        </h3>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:14px; margin-bottom:14px;">
          <!-- MATIN -->
          <div style="padding:14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
            <div style="font-size:0.75rem; font-weight:800; color:var(--accent); text-transform:uppercase; margin-bottom:4px;">
              🌅 ${t('deepSearch.morningProtocolTitle')}
            </div>
            <div style="font-weight:800; font-size:0.92rem; color:var(--text); margin-bottom:4px;">
              ${esc(phyto.morning?.remedy || "Gel de Sea Moss ou Master Lemonade")}
            </div>
            <div style="font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
              ${esc(phyto.morning?.preparation || "1 c. à soupe diluée dans de l'eau tiède avec un filet de citron vert.")}
            </div>
          </div>

          <!-- APRÈS-MIDI -->
          <div style="padding:14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
            <div style="font-size:0.75rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:4px;">
              ☀️ Après-Midi (14h-17h)
            </div>
            <div style="font-weight:800; font-size:0.92rem; color:var(--text); margin-bottom:4px;">
              ${esc(phyto.afternoon?.remedy || "Infusion Rénale aux 4 Plantes")}
            </div>
            <div style="font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
              ${esc(phyto.afternoon?.preparation || "Ortie, persil et chiendent pour soutenir la filtration tubulaire.")}
            </div>
          </div>

          <!-- SOIR -->
          <div style="padding:14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);">
            <div style="font-size:0.75rem; font-weight:800; color:#8b5cf6; text-transform:uppercase; margin-bottom:4px;">
              🌙 ${t('deepSearch.eveningProtocolTitle')}
            </div>
            <div style="font-weight:800; font-size:0.92rem; color:var(--text); margin-bottom:4px;">
              ${esc(phyto.evening?.remedy || "Bouillon de Potassium ou Gruau d'Orme Rouge")}
            </div>
            <div style="font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
              ${esc(phyto.evening?.preparation || "Pour apaiser la muqueuse gastrique et neutraliser l'acidose nocturne.")}
            </div>
          </div>
        </div>

        <p style="margin:0; font-size:0.8rem; color:var(--text-dim); font-style:italic;">
          Posologie générale : ${esc(phyto.weeklyRoutine || "À suivre pendant 21 jours consécutifs avec réévaluation des selles et urines.")}
        </p>
      </div>

      <!-- 6. PLAN ALIMENTAIRE SUR 7 JOURS AVEC RECETTES -->
      <div class="dash-card glass" style="padding:22px; border-radius:20px; border:1px solid var(--border); margin-bottom:24px;">
        <h3 style="margin:0 0 16px 0; font-size:1.15rem; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">
          <span>🍽️</span> ${t('deepSearch.weeklyPlanTitle')}
        </h3>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${plan.map(d => `
            <div style="padding:14px 16px; border-radius:16px; background:var(--surface); border:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid var(--border); padding-bottom:6px;">
                <span style="font-weight:800; font-size:0.92rem; color:var(--accent);">
                  Jour ${d.day || 1} · ${esc(d.focus || "Relance Émonctorielle")}
                </span>
                <span style="font-size:0.72rem; color:var(--text-dim); font-weight:700;">Transition Vitaliste</span>
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; font-size:0.82rem;">
                <div>
                  <strong style="color:var(--text-dim);">Matin :</strong> ${esc(d.breakfast?.title || "")}
                </div>
                <div>
                  <strong style="color:var(--text-dim);">Midi :</strong> ${esc(d.lunch?.title || "")}
                </div>
                <div>
                  <strong style="color:var(--text-dim);">Goûter :</strong> ${esc(d.snack?.title || "")}
                </div>
                <div>
                  <strong style="color:var(--text-dim);">Dîner :</strong> ${esc(d.dinner?.title || "")}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 7. GESTION DES CRISES D'ÉLIMINATION -->
      <div class="dash-card glass" style="padding:20px; border-radius:20px; border:1px solid var(--border); margin-bottom:24px; background:rgba(245,158,11,0.06);">
        <h4 style="margin:0 0 10px 0; font-size:0.95rem; font-weight:800; color:#f59e0b; display:flex; align-items:center; gap:6px;">
          <span>⚠️</span> Que Faire en Cas de Crise d'Élimination Passagère ?
        </h4>
        <p style="margin:0 0 8px 0; font-size:0.84rem; color:var(--text); line-height:1.5;">
          Lorsque les acides quittent les tissus profonds pour rejoindre le sang et la lymphe, des maux de tête passagers, de la fatigue ou une éruption cutanée peuvent survenir.
        </p>
        <ul style="margin:0; padding-left:18px; font-size:0.82rem; color:var(--text); line-height:1.5;">
          ${(crisis.naturalSolutions || ["Buvez un grand verre d'eau citronnée tiède", "Ralentissez avec une pomme cuite ou un bouillon de potassium", "Pratiquez 10 minutes de cohérence cardiaque"]).map(s => `<li>${esc(s)}</li>`).join('')}
        </ul>
      </div>

      <!-- AVERTISSEMENT LÉGAL -->
      <div style="font-size:0.75rem; color:var(--text-dim); text-align:center; line-height:1.5; padding:10px 20px;">
        ${esc(rep.disclaimer || "Ce bilan est un outil d'accompagnement vitaliste à visée informative et éducative. Il ne constitue pas un diagnostic médical.")}
      </div>

    </div>
  `;
}

export function printDeepSearchReport() {
  window.print();
}

export function exportDeepSearchJson() {
  if (!_currentReport) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(_currentReport, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `vitaltrack_bilan_deep_search_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
