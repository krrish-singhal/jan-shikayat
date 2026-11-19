/**
 * Vercel Serverless Function: Health Check (/api/health)
 *
 * Provides a dedicated serverless health verification endpoint on Vercel.
 * Invoking this endpoint confirms serverless execution and emits a log to Vercel's Runtime Logs dashboard.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

  console.log(`[Vercel Serverless Health] Health check verified at ${timestamp} (Client IP: ${ip})`);

  return res.status(200).json({
    status: 'UP',
    platform: 'Vercel Serverless Function',
    service: 'JanShikayat Municipal Portal Edge/API Engine',
    timestamp,
  });
}

