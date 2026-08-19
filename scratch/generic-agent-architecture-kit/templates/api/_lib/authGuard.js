/**
 * Universal Serverless API AuthGuard Middleware
 * 
 * Protects endpoints from unauthorized access by verifying:
 * 1. Matching Same-Origin headers (Host, Referer, Sec-Fetch-Site).
 * 2. Or a valid X-App-Key header matching the APP_SECRET_KEY env var.
 */

const APP_SECRET_KEY = process.env.APP_SECRET_KEY || '';

function verifyAuth(req) {
  if (!APP_SECRET_KEY) {
    // Development fallback if key not configured
    return { valid: true };
  }

  const headerKey = req.headers?.['x-app-key'] || req.headers?.get?.('x-app-key') || '';
  if (headerKey && headerKey === APP_SECRET_KEY) {
    return { valid: true };
  }

  const host = req.headers?.['host'] || '';
  const origin = req.headers?.['origin'] || '';
  const referer = req.headers?.['referer'] || '';
  const secFetchSite = req.headers?.['sec-fetch-site'] || '';

  if (secFetchSite === 'same-origin') {
    return { valid: true };
  }

  if (host) {
    if (origin && origin.includes(host)) return { valid: true };
    if (referer && referer.includes(host)) return { valid: true };
  }

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return { valid: true };
  }

  if (!headerKey) {
    return { valid: false, error: 'Missing X-App-Key header' };
  }

  return { valid: false, error: 'Invalid API key' };
}

function authGuard(req, res) {
  const { valid, error } = verifyAuth(req);
  if (!valid) {
    res.status(401).json({ error: error || 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { verifyAuth, authGuard };
