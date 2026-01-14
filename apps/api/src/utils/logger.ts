const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[LOG_LEVEL as LogLevel] ?? levels.info;

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (currentLevel <= levels.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (currentLevel <= levels.info) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (currentLevel <= levels.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, error?: any, ...args: any[]) => {
    if (currentLevel <= levels.error) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  },
};
