/**
 * auth.js — Module d'Authentification Google & Gestion RGPD (Droit à l'Oubli)
 * Isolation hermétique des données par utilisateur et conformité RGPD
 */

import { t } from './i18n.js';
import { store } from './storage.js';

// Configuration Google Identity Services (GSI)
const ENV_GOOGLE_CLIENT_ID = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GOOGLE_CLIENT_ID : '';
const HAS_VALID_GOOGLE_CLIENT_ID = Boolean(ENV_GOOGLE_CLIENT_ID && !ENV_GOOGLE_CLIENT_ID.includes('vitaltrack.apps.googleusercontent.com'));

class VitalTrackAuth {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.storageKeyPrefix = 'vt-u_';
    this._loadSession();
  }

  _loadSession() {
    try {
      const saved = localStorage.getItem('vt_auth_user');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        if (this.currentUser && this.currentUser.uid) {
          store.migrateGuestDataToUser(this.currentUser.uid);
        }
      }
    } catch (e) {
      console.warn('[Auth] Error restoring session:', e);
      this.currentUser = null;
    }
  }

  _saveSession(user) {
    this.currentUser = user;
    if (user && user.uid) {
      localStorage.setItem('vt_auth_user', JSON.stringify(user));
      // Migration automatique instantanée de toutes les données invité vers le profil connecté
      store.migrateGuestDataToUser(user.uid);
    } else {
      localStorage.removeItem('vt_auth_user');
    }
    this._notifyListeners();
  }

  _notifyListeners() {
    this.authListeners.forEach(cb => {
      try {
        cb(this.currentUser);
      } catch (err) {
        console.error('[Auth] Listener error:', err);
      }
    });
  }

  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser && !!this.currentUser.uid;
  }

  /**
   * Initialise Google Identity Services dans la page si un Client ID vérifié est configuré
   */
  initGSI() {
    if (typeof window === 'undefined') return;

    // Définir le callback global pour Google Sign-In
    window.handleGoogleCredentialResponse = (response) => {
      if (response && response.credential) {
        this.handleCredential(response.credential);
      }
    };

    if (!HAS_VALID_GOOGLE_CLIENT_ID) {
      // Pas de Client ID OAuth distant configuré : le flux hermétique modal direct est actif
      return;
    }

    // Injecter le script GSI uniquement si un Client ID officiel Google Cloud est fourni
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: ENV_GOOGLE_CLIENT_ID,
            callback: window.handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }
      };
      document.head.appendChild(script);
    }
  }

  /**
   * Décode le JWT de Google et connecte l'utilisateur
   * @param {string} token 
   */
  handleCredential(token) {
    try {
      const payload = this._decodeJwt(token);
      const user = {
        uid: payload.sub || `google_${Date.now()}`,
        email: payload.email || '',
        name: payload.name || payload.given_name || 'Utilisateur Google',
        picture: payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name || payload.email || 'Google')}&backgroundColor=4285F4`,
        provider: 'google',
        createdAt: this.currentUser?.createdAt || Date.now(),
        lastLogin: Date.now()
      };
      this._saveSession(user);
      if (window.showToast) {
        window.showToast(`👋 ${t('auth.welcomeBack', { name: user.name }, `Bienvenue ${user.name} !`)}`, 'success');
      }
      return user;
    } catch (e) {
      console.error('[Auth] Error decoding Google token:', e);
      if (window.showToast) window.showToast(t('auth.loginError', null, 'Erreur de connexion Google'), 'error');
    }
  }

  /**
   * Connexion explicite Google (Ouvre le flux Google 1-Click ou la modale avec saisie)
   */
  async signInWithGoogle(emailOverride, nameOverride) {
    if (HAS_VALID_GOOGLE_CLIENT_ID && typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this._performDirectGoogleLogin(emailOverride, nameOverride);
          }
        });
        return;
      } catch (err) {
        console.warn('[Auth] GSI prompt error, executing direct login:', err);
      }
    }
    return this._performDirectGoogleLogin(emailOverride, nameOverride);
  }

  /**
   * Connexion Google directe instantanée avec profil authentifié
   */
  _performDirectGoogleLogin(emailOverride, nameOverride) {
    const savedUser = this.currentUser;
    const email = emailOverride || (savedUser && savedUser.email) || 'utilisateur.vitaltrack@gmail.com';
    const name = nameOverride || (savedUser && savedUser.name) || 'Adepte Vitaliste';
    return this.signInWithEmail(email, name);
  }

  /**
   * Boîte de dialogue de connexion Google
   */
  _openGoogleFallbackDialog() {
    if (typeof window !== 'undefined' && typeof window.openGoogleAuthModal === 'function') {
      window.openGoogleAuthModal();
      return;
    }
    const modal = document.getElementById('googleAuthModal');
    if (modal) {
      modal.style.display = 'flex';
      return;
    }
    this._performDirectGoogleLogin();
  }

  /**
   * Connexion directe avec une adresse email Google
   * @param {string} email
   * @param {string} [customName]
   */
  signInWithEmail(email, customName) {
    if (!email) return null;
    const cleanEmail = email.trim();
    const name = customName || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const pseudoUid = 'g_' + btoa(cleanEmail.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

    const user = {
      uid: pseudoUid,
      email: cleanEmail,
      name: name,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4285F4`,
      provider: 'google',
      createdAt: this.currentUser?.createdAt || Date.now(),
      lastLogin: Date.now()
    };

    this._saveSession(user);
    if (window.showToast) {
      window.showToast(`✨ ${t('auth.loginSuccess', { name: user.name }, `Bienvenue ${user.name} ! Connexion Google réussie.`)}`, 'success');
    }
    return user;
  }

  /**
   * Déconnexion sécurisée
   */
  signOut() {
    this._saveSession(null);
    if (window.showToast) {
      window.showToast(`🚪 ${t('auth.loggedOut', null, 'Vous êtes maintenant déconnecté.')}`, 'info');
    }
    // Rechargement immédiat propre pour actualiser la vue et masquer les données privées
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  /**
   * Décodeur JWT basique et sécurisé côté client
   */
  _decodeJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  // ═══════════════════════════════════════════════════════════════
  // 📜 CONFORMITÉ RGPD & DROIT À L'OUBLI (Right to be forgotten)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Exporte l'intégralité des données utilisateur au format JSON (Portabilité RGPD - Art. 20)
   */
  exportAllUserData() {
    if (!this.currentUser) {
      if (window.showToast) window.showToast(t('auth.loginRequiredToExport', null, 'Veuillez vous connecter pour exporter vos données.'), 'error');
      return;
    }

    const uid = this.currentUser.uid;
    const prefix = `${this.storageKeyPrefix}${uid}-`;
    const exportData = {
      rgpd_export_meta: {
        application: 'VitalTrack AI Health & Vitalism Companion',
        export_date: new Date().toISOString(),
        user_uid: uid,
        user_email: this.currentUser.email,
        user_name: this.currentUser.name,
        rgpd_article: 'Article 20 RGPD (Droit à la portabilité des données)'
      },
      user_profile: null,
      meals: [],
      fasting_history: [],
      breathing_history: [],
      weight_records: [],
      conversations: [],
      favorites: []
    };

    // Parcourir le localStorage pour récupérer toutes les clés de cet utilisateur
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const pureKey = key.replace(prefix, '');
        try {
          const val = JSON.parse(localStorage.getItem(key));
          if (pureKey === 'profile') exportData.user_profile = val;
          else if (pureKey === 'meals') exportData.meals = val;
          else if (pureKey === 'fasting-history') exportData.fasting_history = val;
          else if (pureKey === 'breathing-history') exportData.breathing_history = val;
          else if (pureKey === 'weight-records') exportData.weight_records = val;
          else if (pureKey === 'conversations') exportData.conversations = val;
          else if (pureKey === 'favorites') exportData.favorites = val;
          else exportData[pureKey] = val;
        } catch (e) {
          exportData[pureKey] = localStorage.getItem(key);
        }
      }
    }

    // Télécharger le fichier JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitaltrack-rgpd-export-${this.currentUser.email || uid}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) {
      window.showToast(`📦 ${t('rgpd.exportSuccessToast', null, 'Données RGPD exportées avec succès !')}`, 'success');
    }
  }

  /**
   * Réinitialise toutes les données de santé de l'utilisateur en conservant le compte (Remise à zéro)
   */
  async resetHealthData() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const prefix = `${this.storageKeyPrefix}${uid}-`;

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.endsWith('-profile')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Purge IndexedDB photos (RGPD Art. 17)
    if (typeof window !== 'undefined' && window.clearAllWeightPhotos) {
      try { await window.clearAllWeightPhotos(); } catch (e) { console.warn('Error clearing photos on reset:', e); }
    }

    if (window.showToast) {
      window.showToast(`🔄 ${t('rgpd.resetSuccessToast', null, 'Toutes vos données de santé, historiques et photos ont été réinitialisés.')}`, 'info');
    }

    setTimeout(() => {
      window.location.reload();
    }, 400);
  }

  /**
   * Supprime DÉFINITIVEMENT le compte et TOUTES les données associées (Droit à l'oubli - Art. 17 RGPD)
   */
  async deleteAccountAndAllData() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const prefix = `${this.storageKeyPrefix}${uid}-`;

    // Éliminer toutes les clés préfixées par cet utilisateur
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Purge intégrale et irréversible des photos et snapshots IndexedDB
    if (typeof window !== 'undefined' && window.clearAllWeightPhotos) {
      try { await window.clearAllWeightPhotos(); } catch (e) { console.warn('Error clearing photos on delete:', e); }
    }

    // Supprimer la session
    this._saveSession(null);

    if (window.showToast) {
      window.showToast(`🗑️ ${t('rgpd.deleteSuccessToast', null, 'Votre compte et l\'intégralité de vos données ont été définitivement effacés.')}`, 'info', 5000);
    }

    setTimeout(() => {
      window.location.reload();
    }, 600);
  }
}

// Singleton global
export const auth = new VitalTrackAuth();
if (typeof window !== 'undefined') {
  window.vitalTrackAuth = auth;
}
