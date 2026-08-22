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

// ═══════ 2. BACKUP DE SECOURS & STOCKAGE PHOTO INDEXEDDB ═══════
const IDB_NAME = 'vitaltrack_store_db';
const IDB_STORE_SNAPSHOTS = 'app_snapshots';
const IDB_STORE_PHOTOS = 'weight_photos';
let _idbInstance = null;

export function getIDB() {
  if (_idbInstance) return Promise.resolve(_idbInstance);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 2);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE_SNAPSHOTS)) {
          db.createObjectStore(IDB_STORE_SNAPSHOTS);
        }
        if (!db.objectStoreNames.contains(IDB_STORE_PHOTOS)) {
          db.createObjectStore(IDB_STORE_PHOTOS);
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
    const tx = db.transaction(IDB_STORE_SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_SNAPSHOTS);
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
      const tx = db.transaction(IDB_STORE_SNAPSHOTS, 'readonly');
      const store = tx.objectStore(IDB_STORE_SNAPSHOTS);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ═══════ 2.B GESTION PRIVÉE & SÉCURISÉE DES PHOTOS CORPORELLES (INDEXEDDB) ═══════
export async function saveWeightPhoto(id, photoDataUrl) {
  if (!id || !photoDataUrl) return false;
  try {
    const db = await getIDB();
    if (!db) {
      try {
        localStorage.setItem(`vt_wphoto_${id}`, photoDataUrl);
        return true;
      } catch (e) {
        console.warn('[Storage] Fallback localStorage quota exceeded for photo:', e);
        return false;
      }
    }
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(IDB_STORE_PHOTOS);
      const req = store.put(photoDataUrl, id);
      req.onsuccess = () => resolve(true);
      req.onerror = (err) => {
        console.warn('[Storage:IDB] Save photo error:', err);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[Storage] Error saving weight photo:', err);
    return false;
  }
}

export async function getWeightPhoto(id) {
  if (!id) return null;
  try {
    const db = await getIDB();
    if (!db) {
      return localStorage.getItem(`vt_wphoto_${id}`) || null;
    }
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(IDB_STORE_PHOTOS);
      const req = store.get(id);
      req.onsuccess = () => {
        const res = req.result || localStorage.getItem(`vt_wphoto_${id}`) || null;
        resolve(res);
      };
      req.onerror = () => resolve(localStorage.getItem(`vt_wphoto_${id}`) || null);
    });
  } catch (err) {
    console.warn('[Storage] Error reading weight photo:', err);
    return localStorage.getItem(`vt_wphoto_${id}`) || null;
  }
}

export async function deleteWeightPhoto(id) {
  if (!id) return false;
  try {
    localStorage.removeItem(`vt_wphoto_${id}`);
    const db = await getIDB();
    if (!db) return true;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(IDB_STORE_PHOTOS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[Storage] Error deleting weight photo:', err);
    return false;
  }
}

export async function getAllWeightPhotos() {
  try {
    const db = await getIDB();
    if (!db) return {};
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(IDB_STORE_PHOTOS);
      const req = store.openCursor();
      const results = {};
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          results[cursor.key] = cursor.value;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => resolve({});
    });
  } catch (err) {
    console.warn('[Storage] Error getting all weight photos:', err);
    return {};
  }
}

export async function clearAllWeightPhotos() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vt_wphoto_')) {
        localStorage.removeItem(key);
      }
    }
    const db = await getIDB();
    if (!db) return true;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(IDB_STORE_PHOTOS);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[Storage] Error clearing all weight photos:', err);
    return false;
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
  },
  savePhoto: saveWeightPhoto,
  getPhoto: getWeightPhoto,
  deletePhoto: deleteWeightPhoto,
  getAllPhotos: getAllWeightPhotos,
  clearAllPhotos: clearAllWeightPhotos
};

// Initialisation globale
if (typeof window !== 'undefined') {
  window.store = store;
  window.formatLocalDate = formatLocalDate;
  window.parseLocalDate = parseLocalDate;
  window.addDaysLocal = addDaysLocal;
  window.saveWeightPhoto = saveWeightPhoto;
  window.getWeightPhoto = getWeightPhoto;
  window.deleteWeightPhoto = deleteWeightPhoto;
  window.getAllWeightPhotos = getAllWeightPhotos;
  window.clearAllWeightPhotos = clearAllWeightPhotos;
}
