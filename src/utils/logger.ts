export type LogFunction = (...args: unknown[]) => void;

export interface ILogger {
  log: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
}

export type LoggerOptions = {
  instance: ILogger;
  scope: string;
  isEnabled: boolean;
};

export class Logger implements ILogger {
  protected readonly instance_: ILogger;
  protected readonly scope_: string | null;
  protected readonly isEnabled_: boolean;

  constructor(options?: Some<LoggerOptions>) {
    this.instance_ = options?.instance ?? console;
    this.scope_ = options?.scope ?? null;
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

  private call_(actionKey: keyof ILogger, ...args: unknown[]) {
    const action = this.instance_[actionKey];

    if (this.isEnabled_ && typeof action === 'function') {
      const scopedArgs =
        this.scope_ !== null ? [`[${this.scope_}]`, ...args] : args;
      action(...scopedArgs);
    }
  }
}
