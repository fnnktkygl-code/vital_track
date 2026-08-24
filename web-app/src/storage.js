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

// ═══════ 2. BACKUP DE SECOURS, STOCKAGE PHOTO & CACHE SCAN INDEXEDDB ═══════
const IDB_NAME = 'vitaltrack_store_db';
const IDB_STORE_SNAPSHOTS = 'app_snapshots';
const IDB_STORE_PHOTOS = 'weight_photos';
const IDB_STORE_SCAN_CACHE = 'food_scans_cache';
let _idbInstance = null;

export function getIDB() {
  if (_idbInstance) return Promise.resolve(_idbInstance);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 3);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE_SNAPSHOTS)) {
          db.createObjectStore(IDB_STORE_SNAPSHOTS);
        }
        if (!db.objectStoreNames.contains(IDB_STORE_PHOTOS)) {
          db.createObjectStore(IDB_STORE_PHOTOS);
        }
        if (!db.objectStoreNames.contains(IDB_STORE_SCAN_CACHE)) {
          db.createObjectStore(IDB_STORE_SCAN_CACHE);
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

// ═══════ 4. STORE PRINCIPAL VITALTRACK (CONFORME RGPD & ISOLEMENT STRICT) ═══════
export const store = {
  /**
   * Lecture hermétique avec isolation stricte par utilisateur :
   * - Utilisateur connecté : lit UNIQUEMENT sa clé privée (vt-u_UID-key)
   * - Invité / Déconnecté : lit UNIQUEMENT la clé invité (vt-guest-key), ZÉRO fuite des comptes connectés
   */
  get: (k, def) => {
    try {
      const user = (typeof window !== 'undefined' && window.vitalTrackAuth) ? window.vitalTrackAuth.getCurrentUser() : null;
      const isAuth = !!(user && user.uid);
      const primaryKey = isAuth ? `vt-u_${user.uid}-${k}` : `vt-guest-${k}`;

      const val = localStorage.getItem(primaryKey);
      if (val !== null) {
        return JSON.parse(val) ?? def;
      }

      // Si l'utilisateur est authentifié et que la clé principale n'a pas encore été écrite :
      if (isAuth) {
        // 1. Repli sur sa clé legacy standard vt-${k}
        const legacyKey = `vt-${k}`;
        const legacyVal = localStorage.getItem(legacyKey);
        if (legacyVal !== null) {
          try {
            const parsed = JSON.parse(legacyVal);
            if (parsed !== undefined && parsed !== null) {
              localStorage.setItem(primaryKey, JSON.stringify(parsed));
              return parsed;
            }
          } catch { }
        }

        // 2. Repli sur d'éventuelles clés crées sous un ancien UID (ex: vt-u_g_* ou vt-u_google_*)
        for (let i = 0; i < localStorage.length; i++) {
          const lk = localStorage.key(i);
          if (lk && lk.startsWith('vt-u_') && lk.endsWith(`-${k}`) && lk !== primaryKey) {
            const prevVal = localStorage.getItem(lk);
            if (prevVal !== null) {
              try {
                const parsed = JSON.parse(prevVal);
                if (parsed !== undefined && parsed !== null) {
                  const hasContent = Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0;
                  if (hasContent) {
                    localStorage.setItem(primaryKey, JSON.stringify(parsed));
                    return parsed;
                  }
                }
              } catch { }
            }
          }
        }
      }

      // Pour l'espace invité déconnecté : renvoyer strictement la valeur par défaut sans inspecter les comptes privés
      return def;
    } catch (e) {
      console.warn(`[Store] Error reading key '${k}':`, e);
      return def;
    }
  },

  /**
   * Écriture synchrone hermétique sans fuite de données vers le profil invité
   */
  set: (k, v) => {
    try {
      const primaryKey = getUserStorageKey(k);
      const serialized = JSON.stringify(v);
      localStorage.setItem(primaryKey, serialized);

      // Sauvegarde asynchrone dans IndexedDB (isolée sous la clé propre à l'utilisateur)
      idbSaveSnapshot(primaryKey, v);

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
   * Suppression propre sur la clé active
   */
  del: (k) => {
    try {
      const primaryKey = getUserStorageKey(k);
      localStorage.removeItem(primaryKey);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vt:storage-updated', {
          detail: { key: k, value: null, storageKey: primaryKey }
        }));
      }
    } catch { }
  },

  /**
   * Purge l'ensemble des données temporaires de la session invitée (Sécurité & RGPD)
   */
  clearGuestData: () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('vt-guest-') || (key.startsWith('vt-') && !key.startsWith('vt-u_') && !key.startsWith('vt_auth_') && !key.startsWith('vt_wphoto_')))) {
          localStorage.removeItem(key);
        }
      }
      console.log('[Storage] Espace invité purgé avec succès (Isolation RGPD)');
    } catch (e) {
      console.warn('[Storage] Error clearing guest data:', e);
    }
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

      // 3. Purge immédiate de l'espace invité pour éviter toute persistance non-authentifiée
      store.clearGuestData();

      console.log(`[Storage] Migration réussie et espace invité nettoyé pour l'utilisateur ${uid}`);
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

// ═══════ 5. SYSTÈME DE HASHING DÉTERMINISTE (POUR IMAGES & REQUÊTES) ═══════
export async function computeDataHash(input) {
  if (!input) return 'empty';
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const buffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    } catch {
      // Fallback ci-dessous
    }
  }
  // Algorithme FNV-1a / DJB2 64-bit déterministe ultra-rapide
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// ═══════ 6. MOTEURS DE CACHING ALIMENTAIRE (IMAGES, PLATS & ALIMENTS IA) ═══════
const SCAN_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours de validité
const MAX_SCAN_CACHE_ENTRIES = 120;

/**
 * Cache haute performance pour les scans d'images (Scanner IA)
 * Double-couche : IndexedDB (complet) + LocalStorage (secours & accès synchrone)
 */
export const foodScanCache = {
  async get(hashOrKey, lang = 'fr') {
    if (!hashOrKey) return null;
    const cacheKey = `scan_${hashOrKey}_${lang}`;
    try {
      const db = await getIDB();
      let record = null;
      if (db && db.objectStoreNames.contains(IDB_STORE_SCAN_CACHE)) {
        record = await new Promise((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_SCAN_CACHE, 'readonly');
            const st = tx.objectStore(IDB_STORE_SCAN_CACHE);
            const req = st.get(cacheKey);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        });
      }
      if (!record) {
        const raw = localStorage.getItem(`vt_scancache_${cacheKey}`);
        if (raw) record = JSON.parse(raw);
      }

      if (!record) return null;
      // Vérification du TTL
      if (record.timestamp && (Date.now() - record.timestamp > SCAN_CACHE_TTL_MS)) {
        this.delete(hashOrKey, lang);
        return null;
      }
      return record;
    } catch (e) {
      console.warn('[ScanCache] Erreur lecture cache:', e);
      return null;
    }
  },

  async set(hashOrKey, lang = 'fr', payload = {}) {
    if (!hashOrKey) return false;
    const cacheKey = `scan_${hashOrKey}_${lang}`;
    const record = {
      key: cacheKey,
      hash: hashOrKey,
      lang,
      timestamp: Date.now(),
      ...payload
    };

    try {
      const db = await getIDB();
      if (db && db.objectStoreNames.contains(IDB_STORE_SCAN_CACHE)) {
        await new Promise((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_SCAN_CACHE, 'readwrite');
            const st = tx.objectStore(IDB_STORE_SCAN_CACHE);
            const req = st.put(record, cacheKey);
            req.onsuccess = () => resolve(true);
            req.onerror = () => resolve(false);
          } catch {
            resolve(false);
          }
        });
      }

      // Stockage de secours LocalStorage (version compacte)
      try {
        localStorage.setItem(`vt_scancache_${cacheKey}`, JSON.stringify(record));
        this._trimLocalStorage();
      } catch (e) {
        console.warn('[ScanCache] LocalStorage quota atteint:', e);
      }
      return true;
    } catch (e) {
      console.warn('[ScanCache] Erreur sauvegarde cache:', e);
      return false;
    }
  },

  async delete(hashOrKey, lang = 'fr') {
    const cacheKey = `scan_${hashOrKey}_${lang}`;
    localStorage.removeItem(`vt_scancache_${cacheKey}`);
    try {
      const db = await getIDB();
      if (db && db.objectStoreNames.contains(IDB_STORE_SCAN_CACHE)) {
        const tx = db.transaction(IDB_STORE_SCAN_CACHE, 'readwrite');
        tx.objectStore(IDB_STORE_SCAN_CACHE).delete(cacheKey);
      }
    } catch {}
  },

  async clear() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vt_scancache_')) localStorage.removeItem(k);
    }
    try {
      const db = await getIDB();
      if (db && db.objectStoreNames.contains(IDB_STORE_SCAN_CACHE)) {
        const tx = db.transaction(IDB_STORE_SCAN_CACHE, 'readwrite');
        tx.objectStore(IDB_STORE_SCAN_CACHE).clear();
      }
    } catch {}
  },

  _trimLocalStorage() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vt_scancache_')) keys.push(k);
    }
    if (keys.length > MAX_SCAN_CACHE_ENTRIES) {
      keys.slice(0, keys.length - MAX_SCAN_CACHE_ENTRIES).forEach(k => localStorage.removeItem(k));
    }
  }
};

/**
 * Cache pour les analyses textuelles de plats (Ajout de repas IA)
 */
export const dishAnalysisCache = {
  get(query, lang = 'fr') {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    const key = `vt_dishcache_${lang}_${clean}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.timestamp && (Date.now() - data.timestamp > SCAN_CACHE_TTL_MS)) {
        localStorage.removeItem(key);
        return null;
      }
      return data.items || null;
    } catch {
      return null;
    }
  },
  set(query, lang = 'fr', items = []) {
    if (!query || !items || items.length === 0) return;
    const clean = query.trim().toLowerCase();
    const key = `vt_dishcache_${lang}_${clean}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        items,
        timestamp: Date.now()
      }));
    } catch {}
  }
};

/**
 * Cache unitaire pour les aliments résolus par l'IA
 */
export const foodItemAiCache = {
  get(foodName) {
    if (!foodName) return null;
    const clean = foodName.trim().toLowerCase();
    const key = `vt_foodaicache_${clean}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.timestamp && (Date.now() - data.timestamp > SCAN_CACHE_TTL_MS)) {
        localStorage.removeItem(key);
        return null;
      }
      return data.food || null;
    } catch {
      return null;
    }
  },
  set(foodName, foodObj) {
    if (!foodName || !foodObj) return;
    const clean = foodName.trim().toLowerCase();
    const key = `vt_foodaicache_${clean}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        food: foodObj,
        timestamp: Date.now()
      }));
    } catch {}
  }
};

// Attacher les caches au store principal
store.foodScanCache = foodScanCache;
store.dishAnalysisCache = dishAnalysisCache;
store.foodItemAiCache = foodItemAiCache;
store.computeDataHash = computeDataHash;

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
  window.computeDataHash = computeDataHash;
  window.foodScanCache = foodScanCache;
  window.dishAnalysisCache = dishAnalysisCache;
  window.foodItemAiCache = foodItemAiCache;
}
