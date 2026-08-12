/**
 * GET /api/health — Health check endpoint
 */
module.exports = function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'vital-track-vercel-proxy',
    timestamp: new Date().toISOString(),
  });
};
