import { URLError } from './errors';
import { ILogger, Logger } from './logger';

type URLOptions = {
  baseUrl: string;
  logger: ILogger;
};

const NODE_ENV = process.env.NODE_ENV;

export class SafeURL<R extends string> {
  private readonly url_: URL;

  protected readonly route_: R;
  protected logger_: ILogger;

  constructor(route: R, options?: Some<URLOptions>) {
    try {
      this.url_ = new URL(route, options?.baseUrl);
      this.route_ = route;

      this.logger_ = new Logger({
        instance: options?.logger,
        isEnabled: !NODE_ENV || NODE_ENV === 'development',
      });
    } catch (error) {
      throw new URLError(error);
    }
  }

  getHash() {
    return this.url_.hash;
  }

  getHost() {
    return this.url_.host;
  }

  getHostName() {
    return this.url_.hostname;
  }

  getHref() {
    return this.url_.href;
  }

  getOrigin() {
    return this.url_.origin;
  }

  getPassword() {
    return this.url_.password;
  }

  getPathname() {
    return this.url_.pathname;
  }

  getPort() {
    return this.url_.port;
  }

  getProtocol() {
    return this.url_.protocol;
  }

  getSearch() {
    return this.url_.search;
  }

  getSearchParams() {
    return this.url_.searchParams;
  }

  getUsername() {
    return this.url_.username;
  }
}
