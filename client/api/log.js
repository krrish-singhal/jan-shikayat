/**
 * Vercel Serverless Function: Client Log & Telemetry Forwarder (/api/log)
 *
 * Receives client-side console logs, errors, and unhandled exceptions from the browser
 * and writes them directly to stdout/stderr. Because this executes as a Vercel Serverless Function,
 * every log statement is automatically captured and streamed in real-time to the Vercel Dashboard
 * under the "Runtime Logs" tab.
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Pre-flight check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Diagnostic ping to easily verify Vercel logs from a browser or curl
  if (req.method === 'GET') {
    const timestamp = new Date().toISOString();
    console.log(`[Vercel Runtime Log] Diagnostic GET /api/log invoked at ${timestamp} (IP: ${req.headers['x-forwarded-for'] || 'unknown'})`);
    return res.status(200).json({
      status: 'active',
      service: 'JanShikayat Vercel Runtime Logger',
      timestamp,
      message: 'Log entry successfully emitted to Vercel Runtime Logs.',
    });
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = { message: body };
        }
      }

      const {
        level = 'info',
        message = 'No message provided',
        data = null,
        url = 'unknown',
        userAgent = 'unknown',
        timestamp = new Date().toISOString(),
      } = body || {};

      const formattedLine = `[Client Log][${level.toUpperCase()}] ${timestamp} | ${url} | ${message}`;

      switch (level.toLowerCase()) {
        case 'error':
          console.error(formattedLine, data ? JSON.stringify(data) : '');
          break;
        case 'warn':
          console.warn(formattedLine, data ? JSON.stringify(data) : '');
          break;
        case 'debug':
          console.log(formattedLine, data ? JSON.stringify(data) : '');
          break;
        default:
          console.log(formattedLine, data ? JSON.stringify(data) : '');
          break;
      }

      return res.status(200).json({ success: true, loggedAt: timestamp });
    } catch (err) {
      console.error('[Vercel Runtime Log] Failed to parse client log payload:', err.message);
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

