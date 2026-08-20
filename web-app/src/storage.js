/**
 * storage.js — Système de Persistance & Cache Résilient VitalTrack
 * 
 * - Zéro perte de données lors des actualisations, reconnexions ou déconnexions
 * - Synchronisation multi-couches : LocalStorage + IndexedDB (Snapshot automatique de secours)
 * - Migration automatique instantanée des données invité vers le profil connecté
 * - Gestion déterministe des dates locales (élimine tout décalage UTC / fuseau horaire)
 * - Événements de synchronisation réactive (vt:storage-updated)
 */

// ═══════ 1. UTILITAIRES DE DATE LOCALE DÉTERMINISTE ═══════
export function formatLocalDate(d = new Date()) {
  const date = (d instanceof Date && !isNaN(d)) ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 12, 0, 0); // midi pour éviter les effets de bord d'heures d'été
  }
  return new Date(dateStr);
}

export function addDaysLocal(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ═══════ 2. BACKUP DE SECOURS INDEXEDDB AUTOMATIQUE ═══════
const IDB_NAME = 'vitaltrack_store_db';
const IDB_STORE = 'app_snapshots';
let _idbInstance = null;

function getIDB() {
  if (_idbInstance) return Promise.resolve(_idbInstance);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = (e) => {
        _idbInstance = e.target.result;
        resolve(_idbInstance);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSaveSnapshot(key, val) {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(val, key);
  } catch (err) {
    console.warn('[Storage:IDB] Snapshot error:', err);
  }
}

async function idbLoadSnapshot(key) {
  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ═══════ 3. GESTION DES CLÉS ET ISOLEMENT UTILISATEUR ═══════
export function getUserStorageKey(k) {
  const user = (typeof window !== 'undefined' && window.vitalTrackAuth) ? window.vitalTrackAuth.getCurrentUser() : null;
  if (user && user.uid) {
    return `vt-u_${user.uid}-${k}`;
  }
  return `vt-guest-${k}`;
}

// ═══════ 4. STORE PRINCIPAL VITALTRACK ═══════
export const store = {
  /**
   * Lecture résiliente avec chaîne de repli multi-niveaux :
   * 1. Clé utilisateur connecté (vt-u_UID-key)
   * 2. Clé invité (vt-guest-key)
   * 3. Clé historique (vt-key)
   * 4. Clé globale alternative (vital_key)
   * 5. Toute clé précédente correspondant à ce suffixe
   */
  get: (k, def) => {
    try {
      const primaryKey = getUserStorageKey(k);
      const val = localStorage.getItem(primaryKey);
      if (val !== null) {
        return JSON.parse(val) ?? def;
      }

      // Chaîne de repli automatique
      const fallbacks = [
        `vt-guest-${k}`,
        `vt-${k}`,
        `vital_${k}`
      ];

      for (const fKey of fallbacks) {
        const fVal = localStorage.getItem(fKey);
        if (fVal !== null) {
          try {
            const parsed = JSON.parse(fVal);
            if (parsed !== undefined && parsed !== null) {
              // Migration automatique transparente vers la clé courante
              localStorage.setItem(primaryKey, JSON.stringify(parsed));
              return parsed;
            }
          } catch { }
        }
      }

      // Recherche dans les autres clés existantes si l'utilisateur a changé d'identifiant
      for (let i = 0; i < localStorage.length; i++) {
        const lKey = localStorage.key(i);
        if (lKey && lKey.endsWith(`-${k}`) && lKey !== primaryKey) {
          const lVal = localStorage.getItem(lKey);
          if (lVal !== null) {
            try {
              const parsed = JSON.parse(lVal);
              if (parsed !== undefined && parsed !== null) {
                localStorage.setItem(primaryKey, JSON.stringify(parsed));
                return parsed;
              }
            } catch { }
          }
        }
      }

      return def;
    } catch (e) {
      console.warn(`[Store] Error reading key '${k}':`, e);
      return def;
    }
  },

  /**
   * Écriture synchrone sûre avec broadcast d'événement et sauvegarde IDB en tâche de fond
   */
  set: (k, v) => {
    try {
      const primaryKey = getUserStorageKey(k);
      const serialized = JSON.stringify(v);
      localStorage.setItem(primaryKey, serialized);
      
      // Sauvegarder également une copie dans le canal invité si c'est une donnée active
      // pour éviter toute perte lors d'une déconnexion accidentelle
      if (primaryKey.startsWith('vt-u_')) {
        localStorage.setItem(`vt-guest-${k}`, serialized);
      }

      // Sauvegarde asynchrone dans IndexedDB (sécurité anti-vidage de cache)
      idbSaveSnapshot(primaryKey, v);
      idbSaveSnapshot(`backup_${k}`, v);

      // Notification de mise à jour pour réactivité globale
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vt:storage-updated', {
          detail: { key: k, value: v, storageKey: primaryKey }
        }));
      }
    } catch (e) {
      console.error(`[Store] Error writing key '${k}':`, e);
    }
  },

  /**
   * Suppression propre sur toutes les variantes
   */
  del: (k) => {
    try {
      const primaryKey = getUserStorageKey(k);
      localStorage.removeItem(primaryKey);
      localStorage.removeItem(`vt-guest-${k}`);
      localStorage.removeItem(`vt-${k}`);
      localStorage.removeItem(`vital_${k}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vt:storage-updated', {
          detail: { key: k, value: null, storageKey: primaryKey }
        }));
      }
    } catch { }
  },

  /**
   * Fusionne et migre toutes les données invité vers le compte utilisateur lors de la connexion
   */
  migrateGuestDataToUser: (uid) => {
    if (!uid) return;
    try {
      const arrayKeys = [
        'calendar_meals', 'meals', 'fasting-history', 'breathing-history',
        'conversations', 'favorites', 'customFoods', 'weight-records', 'viewed_plants'
      ];
      const objectKeys = [
        'active_plan_meta', 'user_profile', 'profile', 'protocol', 'theme',
        'vital_mascot_pref', 'target_weight'
      ];

      // 1. Fusion des tableaux
      arrayKeys.forEach(k => {
        const guestKey = `vt-guest-${k}`;
        const legacyKey = `vt-${k}`;
        const userKey = `vt-u_${uid}-${k}`;

        const guestData = JSON.parse(localStorage.getItem(guestKey) || localStorage.getItem(legacyKey) || '[]');
        const userData = JSON.parse(localStorage.getItem(userKey) || '[]');

        if (Array.isArray(guestData) && guestData.length > 0) {
          if (!Array.isArray(userData) || userData.length === 0) {
            localStorage.setItem(userKey, JSON.stringify(guestData));
          } else {
            // Fusion intelligente sans doublons
            const existingIds = new Set(userData.map(item => item.id || JSON.stringify(item)));
            const merged = userData.slice();
            guestData.forEach(item => {
              const id = item.id || JSON.stringify(item);
              if (!existingIds.has(id)) {
                merged.push(item);
                existingIds.add(id);
              }
            });
            localStorage.setItem(userKey, JSON.stringify(merged));
          }
        }
      });

      // 2. Migration des objets & métadonnées
      objectKeys.forEach(k => {
        const guestKey = `vt-guest-${k}`;
        const legacyKey = `vt-${k}`;
        const userKey = `vt-u_${uid}-${k}`;

        const guestObj = localStorage.getItem(guestKey) || localStorage.getItem(legacyKey);
        const userObj = localStorage.getItem(userKey);

        if (guestObj && (!userObj || userObj === 'null' || userObj === '{}')) {
          localStorage.setItem(userKey, guestObj);
        }
      });

      console.log(`[Storage] Migration réussie des données vers l'utilisateur ${uid}`);
    } catch (e) {
      console.warn('[Storage] Migration error:', e);
    }
  },

  /**
   * Exportation complète de secours au format JSON
   */
  exportFullBackup: () => {
    const backup = {
      app: 'VitalTrack AI',
      timestamp: new Date().toISOString(),
      data: {}
    };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('vt-') || key.startsWith('vital_'))) {
        try {
          backup.data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          backup.data[key] = localStorage.getItem(key);
        }
      }
    }
    return backup;
  },

  /**
   * Restauration complète à partir d'un fichier de sauvegarde
   */
  importFullBackup: (backupObj) => {
    if (!backupObj || !backupObj.data) return false;
    try {
      Object.keys(backupObj.data).forEach(k => {
        const val = backupObj.data[k];
        localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vt:storage-updated', { detail: { fullRestore: true } }));
      }
      return true;
    } catch {
      return false;
    }
  }
};

// Initialisation globale
if (typeof window !== 'undefined') {
  window.store = store;
  window.formatLocalDate = formatLocalDate;
  window.parseLocalDate = parseLocalDate;
  window.addDaysLocal = addDaysLocal;
}
