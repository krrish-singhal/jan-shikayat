/**
 * JanShikayat Unified Client Logger
 * Provides structured, styled console logging for browser DevTools in production and development,
 * and seamlessly forwards critical client events and errors to Vercel Serverless Runtime Logs (/api/log).
 */

const LOG_ENDPOINT = '/api/log';

const isBrowser = typeof window !== 'undefined';
const isProd = import.meta.env?.PROD ?? false;

const formatTime = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
};

const formatMessageArgs = (args) => {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
};

class ClientLogger {
  constructor() {
    this.initialized = false;
    this.forwardErrorsToVercel = true;
  }

  /**
   * Transmit log payload to Vercel Serverless Function (/api/log)
   */
  sendToVercel(level, message, data = null) {
    if (!isBrowser || !this.forwardErrorsToVercel) return;

    // Do not forward logs generated while calling the log endpoint itself
    if (typeof message === 'string' && message.includes(LOG_ENDPOINT)) return;

    try {
      const payload = JSON.stringify({
        level,
        message: typeof message === 'string' ? message : formatMessageArgs([message]),
        data: data ? (typeof data === 'object' ? data : String(data)) : null,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

      // Use navigator.sendBeacon if available (non-blocking, survives navigation)
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(LOG_ENDPOINT, blob);
      } else {
        fetch(LOG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Silent catch to prevent recursive error handling
        });
      }
    } catch {
      // Fail silently to never disrupt application execution
    }
  }

  info(message, ...args) {
    const time = formatTime();
    console.log(
      `%c[JanShikayat]%c %cINFO%c [${time}] ${message}`,
      'background:#0284c7;color:#fff;font-weight:700;padding:2px 5px;border-radius:3px 0 0 3px;',
      '',
      'background:#38bdf8;color:#0f172a;font-weight:600;padding:2px 4px;border-radius:0 3px 3px 0;',
      'color:inherit;',
      ...args
    );
  }

  log(message, ...args) {
    this.info(message, ...args);
  }

  debug(message, ...args) {
    const time = formatTime();
    console.debug(
      `%c[JanShikayat]%c %cDEBUG%c [${time}] ${message}`,
      'background:#64748b;color:#fff;font-weight:700;padding:2px 5px;border-radius:3px 0 0 3px;',
      '',
      'background:#94a3b8;color:#0f172a;font-weight:600;padding:2px 4px;border-radius:0 3px 3px 0;',
      'color:inherit;',
      ...args
    );
  }

  warn(message, ...args) {
    const time = formatTime();
    console.warn(
      `%c[JanShikayat]%c %cWARN%c [${time}] ${message}`,
      'background:#d97706;color:#fff;font-weight:700;padding:2px 5px;border-radius:3px 0 0 3px;',
      '',
      'background:#fbbf24;color:#0f172a;font-weight:600;padding:2px 4px;border-radius:0 3px 3px 0;',
      'color:inherit;',
      ...args
    );
    this.sendToVercel('warn', message, args.length > 0 ? args : null);
  }

  error(message, ...args) {
    const time = formatTime();
    console.error(
      `%c[JanShikayat]%c %cERROR%c [${time}] ${message}`,
      'background:#dc2626;color:#fff;font-weight:700;padding:2px 5px;border-radius:3px 0 0 3px;',
      '',
      'background:#f87171;color:#0f172a;font-weight:600;padding:2px 4px;border-radius:0 3px 3px 0;',
      'color:inherit;',
      ...args
    );
    this.sendToVercel('error', message, args.length > 0 ? args : null);
  }

  /**
   * Initialize Global Error Listeners and Welcome Diagnostics
   */
  init() {
    if (!isBrowser || this.initialized) return;
    this.initialized = true;

    // Welcome / startup banner in developer console
    console.log(
      '%c JanShikayat %c Municipal Grievance Redressal %c v1.0.0 ',
      'background:#1e3a8a;color:#ffffff;font-weight:800;padding:4px 6px;border-radius:4px 0 0 4px;',
      'background:#0284c7;color:#ffffff;font-weight:600;padding:4px 6px;',
      'background:#0f172a;color:#38bdf8;font-weight:600;padding:4px 6px;border-radius:0 4px 4px 0;'
    );
    console.log(`[JanShikayat] Mode: ${import.meta.env?.MODE || 'production'} | Origin: ${window.location.origin}`);
    console.log(`[JanShikayat] API Base: ${import.meta.env?.VITE_API_URL || 'http://localhost:5000/api/v1'}`);

    // Capture uncaught window errors
    window.addEventListener('error', (event) => {
      this.error(`Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      this.error(`Unhandled Promise Rejection: ${message}`, reason);
    });
  }
}

export const logger = new ClientLogger();
export default logger;

