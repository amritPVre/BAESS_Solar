/**
 * Vercel Serverless Function: Health Check
 * Path: /api/health
 */

export default async function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Dodo Payments API server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      checkout: '/api/checkout/create-session',
      webhook: '/api/webhooks/dodo',
      subscriptionStatus: '/api/subscription/status',
      subscriptionCancel: '/api/subscription/cancel',
    }
  });
}

