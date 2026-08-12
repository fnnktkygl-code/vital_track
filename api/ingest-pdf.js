/**
 * POST /api/ingest-pdf — PDF Text Extraction for Knowledge Base
 * 
 * Receives a base64-encoded PDF, extracts text, chunks it, and returns
 * the chunks for client-side storage. No server-side persistence.
 * This replaces the wasteful base64-per-chat-message pattern (audit fix #11).
 */
const { authGuard } = require('./_lib/auth');

/**
 * Simple paragraph-based text chunker.
 * Splits on double newlines and groups into ~500 char chunks.
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

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!authGuard(req, res)) return;

  try {
    const { pdfData, filename } = req.body || {};

    if (!pdfData) {
      return res.status(400).json({ error: 'pdfData (base64) is required' });
    }

    // Dynamically import pdf-parse
    let pdfParse;
    try {
      pdfParse = require('pdf-parse');
    } catch {
      return res.status(500).json({ error: 'pdf-parse not available on server' });
    }

    const buffer = Buffer.from(pdfData, 'base64');
    const pdfResult = await pdfParse(buffer);

    const rawText = pdfResult.text || '';
    if (!rawText.trim()) {
      return res.status(200).json({
        chunks: [],
        pageCount: pdfResult.numpages || 0,
        warning: 'No text extracted from PDF (might be image-only)',
      });
    }

    const chunks = chunkText(rawText);

    res.status(200).json({
      chunks,
      pageCount: pdfResult.numpages || 0,
      charCount: rawText.length,
      chunkCount: chunks.length,
      filename: filename || 'unknown.pdf',
    });
  } catch (error) {
    console.error('[/api/ingest-pdf] Error:', error.message);
    res.status(500).json({ error: 'PDF processing failed', detail: error.message });
  }
};
