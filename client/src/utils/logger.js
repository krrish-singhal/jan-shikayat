/**
 * Client Logger
 * Standard, unstyled browser console logger.
 */

class ClientLogger {
  info(...args) {
    console.log(...args);
  }

  log(...args) {
    console.log(...args);
  }

  debug(...args) {
    console.debug(...args);
  }

  warn(...args) {
    console.warn(...args);
  }

  error(...args) {
    console.error(...args);
  }

  init() {
    // No-op: standard console logging without custom banners or interception
  }
}

export const logger = new ClientLogger();
export default logger;
