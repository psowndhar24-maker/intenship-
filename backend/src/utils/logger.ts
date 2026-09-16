function sanitizeMessage(val: unknown): unknown {
  if (typeof val === 'string') {
    return val
      .replace(/postgres(?:ql)?:\/\/[^:]+:([^@]+)@/gi, 'postgresql://***:***@')
      .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED]')
      .replace(/(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-./+=]{8,})['"]?/gi, '$1=[REDACTED]');
  }
  return val;
}

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (process.env.DEBUG) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DEBUG] [INTERNHUB-SRV] ${sanitizeMessage(message)}`, meta ? meta : '');
    }
  },
  info: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] [INTERNHUB-SRV] ${sanitizeMessage(message)}`, meta ? meta : '');
  },
  warn: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] [INTERNHUB-SRV] ${sanitizeMessage(message)}`, meta ? meta : '');
  },
  error: (message: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    const safeError = error instanceof Error ? sanitizeMessage(error.message) : error;
    console.error(`[${timestamp}] [ERROR] [INTERNHUB-SRV] ${sanitizeMessage(message)}`, safeError ? safeError : '');
  }
};
