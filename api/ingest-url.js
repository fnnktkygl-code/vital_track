/**
 * POST /api/ingest-url — URL Content Extraction for Knowledge Base
 * 
 * Scrapes a web page URL and extracts its text content for the knowledge base.
 * Returns chunked text for client-side storage.
 */
const { authGuard } = require('./_lib/auth');

/**
 * Simple paragraph-based text chunker.
 */
function chunkText(text, maxChunkSize = 500) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let buffer = '';

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (trimmed.length < 20) continue;

    if (buffer.length + trimmed.length > maxChunkSize && buffer.length > 0) {
      chunks.push(buffer.trim());
      buffer = '';
    }
    buffer += trimmed + '\n\n';
  }

  if (buffer.trim()) {
    chunks.push(buffer.trim());
  }

  return chunks;
}

/**
 * Extract meaningful text from HTML, stripping tags, scripts, styles.
 */
function htmlToText(html) {
  return html
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove nav, header, footer
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    // Convert headings and paragraphs to newlines
    .replace(/<\/?(h[1-6]|p|div|br|li|tr)[^>]*>/gi, '\n')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-zA-Z]+;/g, ' ')
    // Clean whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!authGuard(req, res)) return;

  try {
    const { url } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch the page
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'VitalTrack-Knowledge-Bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch URL: HTTP ${response.status}` });
    }

    const html = await response.text();
    const text = htmlToText(html);

    if (!text || text.length < 50) {
      return res.status(200).json({
        chunks: [],
        warning: 'No meaningful text content extracted from URL',
      });
    }

    const chunks = chunkText(text);

    res.status(200).json({
      chunks,
      charCount: text.length,
      chunkCount: chunks.length,
      sourceUrl: url,
    });
  } catch (error) {
    console.error('[/api/ingest-url] Error:', error.message);
    res.status(500).json({ error: 'URL extraction failed', detail: error.message });
  }
};
