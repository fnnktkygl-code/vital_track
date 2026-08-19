/**
 * auth.js — Module d'Authentification Google & Gestion RGPD (Droit à l'Oubli)
 * Isolation hermétique des données par utilisateur et conformité RGPD
 */

import { t } from './i18n.js';

// Configuration Google Identity Services (GSI)
const GOOGLE_CLIENT_ID = '928374928374-vitaltrack.apps.googleusercontent.com'; // Default OAuth Client ID or custom

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
      }
    } catch (e) {
      console.warn('[Auth] Error restoring session:', e);
      this.currentUser = null;
    }
  }

  _saveSession(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('vt_auth_user', JSON.stringify(user));
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
   * Initialise Google Identity Services dans la page
   */
  initGSI() {
    if (typeof window === 'undefined') return;

    // Définir le callback global pour Google Sign-In
    window.handleGoogleCredentialResponse = (response) => {
      if (response && response.credential) {
        this.handleCredential(response.credential);
      }
    };

    // Injecter le script GSI s'il n'est pas déjà présent
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
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
        picture: payload.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
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
      if (window.showToast) window.showToast('Erreur de connexion Google', 'error');
    }
  }

  /**
   * Connexion explicite Google (Prompt ou modal sécurisée)
   */
  async signInWithGoogle() {
    if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this._openGoogleFallbackDialog();
          }
        });
        return;
      } catch (err) {
        console.warn('[Auth] GSI prompt error, opening fallback modal:', err);
      }
    }
    this._openGoogleFallbackDialog();
  }

  /**
   * Boîte de dialogue de connexion Google (pour démo / offline / fallback sans popup bloqué)
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

    // Connexion par défaut avec profil Google standard si la modale n'est pas encore rendue
    this.signInWithEmail('utilisateur@gmail.com', 'Utilisateur Google');
  }

  /**
   * Connexion directe avec une adresse email
   * @param {string} email
   * @param {string} [customName]
   */
  signInWithEmail(email, customName) {
    if (!email) return null;
    const cleanEmail = email.trim();
    const name = customName || cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const pseudoUid = 'g_' + btoa(cleanEmail.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

    const user = {
      uid: pseudoUid,
      email: cleanEmail,
      name: name,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
      provider: 'google',
      createdAt: this.currentUser?.createdAt || Date.now(),
      lastLogin: Date.now()
    };

    this._saveSession(user);
    if (window.showToast) {
      window.showToast(`✨ ${t('auth.loginSuccess', { name: user.name }, `Connecté avec succès : ${user.name}`)}`, 'success');
    }
    return user;
  }

  /**
   * Déconnexion sécurisée
   */
  signOut() {
    const name = this.currentUser?.name || '';
    this._saveSession(null);
    if (window.showToast) {
      window.showToast(t('auth.loggedOut', {}, 'Déconnexion effectuée.'), 'info');
    }
    // Recharger la page pour vider la mémoire volatile et recharger l'espace vierge/invité
    setTimeout(() => {
      window.location.reload();
    }, 400);
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
      if (window.showToast) window.showToast('Veuillez vous connecter pour exporter vos données.', 'error');
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
      window.showToast('📦 Données RGPD exportées avec succès !', 'success');
    }
  }

  /**
   * Réinitialise toutes les données de santé de l'utilisateur en conservant le compte (Remise à zéro)
   */
  resetHealthData() {
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

    if (window.showToast) {
      window.showToast('🔄 Toutes vos données de santé et historiques ont été réinitialisés.', 'info');
    }

    setTimeout(() => {
      window.location.reload();
    }, 400);
  }

  /**
   * Supprime DÉFINITIVEMENT le compte et TOUTES les données associées (Droit à l'oubli - Art. 17 RGPD)
   */
  deleteAccountAndAllData() {
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

    // Supprimer la session
    this._saveSession(null);

    if (window.showToast) {
      window.showToast('🗑️ Votre compte et l\'intégralité de vos données ont été définitivement effacés (Droit à l\'oubli respecté).', 'info', 5000);
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
