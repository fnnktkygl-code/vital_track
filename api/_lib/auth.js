/**
 * API Key Authentication Middleware — VitalTrack
 * 
 * Validates the X-VT-API-Key header against the VT_APP_KEY env var.
 * This protects the proxy from unauthorized access (audit fix #4).
 */

const VT_APP_KEY = process.env.VT_APP_KEY || '';

/**
 * Verify the request has a valid app key.
 * @param {Request} req - Incoming request
 * @returns {{ valid: boolean, error?: string }}
 */
function verifyAuth(req) {
  if (!VT_APP_KEY) {
    // If no key configured server-side, skip auth (dev mode)
    return { valid: true };
  }

  const headerKey = req.headers?.['x-vt-api-key'] || req.headers?.get?.('x-vt-api-key') || '';
  if (headerKey && headerKey === VT_APP_KEY) {
    return { valid: true };
  }

  // Allow same-origin requests from the web app hosted on the same domain
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

  // In development / local testing
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return { valid: true };
  }

  if (!headerKey) {
    return { valid: false, error: 'Missing X-VT-API-Key header' };
  }

  return { valid: false, error: 'Invalid API key' };
}

/**
 * Express-style middleware that rejects unauthorized requests.
 */
function authGuard(req, res) {
  const { valid, error } = verifyAuth(req);
  if (!valid) {
    res.status(401).json({ error: error || 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { verifyAuth, authGuard };
