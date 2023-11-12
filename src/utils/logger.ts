export type LogFunction = (...args: unknown[]) => void;
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'all';

export interface ILogger {
  log: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
}

export type LoggerOptions = {
  instance: ILogger;
  scope: string;
  level: LogLevel | LogLevel[];
  isEnabled: boolean;
};

const LOG_LEVEL_BY_ACTION_KEY: Record<keyof ILogger, LogLevel> = {
  log: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'warn',
};

const ensureArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];

export class Logger implements ILogger {
  protected readonly instance_: ILogger;
  protected readonly scope_: string | null;
  protected readonly levels_: LogLevel[];
  protected readonly isEnabled_: boolean;

  constructor(options?: Some<LoggerOptions>) {
    this.instance_ = options?.instance ?? console;
    this.scope_ = options?.scope ?? null;
    this.levels_ =
      options?.level === undefined ? ['all'] : ensureArray(options.level);
    this.isEnabled_ = options?.isEnabled ?? true;
  }

  log(...args: unknown[]) {
    this.call_('log', ...args);
  }

  info(...args: unknown[]) {
    this.call_('info', ...args);
  }

  warn(...args: unknown[]) {
    this.call_('warn', ...args);
  }

  error(...args: unknown[]) {
    this.call_('error', ...args);
  }

  traceWarn(...args: unknown[]) {
    const stack = new Error().stack?.replace(/^error/iu, '');

    if (stack !== undefined) {
      this.call_('warn', ...args, stack);
    } else {
      this.call_('warn', ...args);
    }
  }

  private call_(actionKey: keyof ILogger, ...args: unknown[]) {
    if (
      this.levels_.includes('all') ||
      this.levels_.includes(LOG_LEVEL_BY_ACTION_KEY[actionKey])
    ) {
      const action = this.instance_[actionKey];

      if (this.isEnabled_ && typeof action === 'function') {
        const scopedArgs =
          this.scope_ !== null ? [`[${this.scope_}]`, ...args] : args;
        action(...scopedArgs);
      }
    }
  }
}
