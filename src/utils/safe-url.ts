import { URLError } from './errors';
import { ILogger, Logger } from './logger';
import { freezeProperty } from './object';

type URLOptions = {
  baseUrl: string;
  logger: ILogger;
};

const NODE_ENV = process.env.NODE_ENV;

const HASH_REGEXPS = {
  allowedHash: /#\*$/,
  staticHash: /#([^\*]?|.{2,})$/,
};

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

      if (!HASH_REGEXPS.allowedHash.test(this.route_)) {
        freezeProperty(this.url_, 'hash');
        this.logger_.info(
          `URL hash value of the route "${this.route_}" is frozen`,
        );
      }
    } catch (error) {
      throw new URLError(error);
    }
  }

  /**
   * Sets an URL hash value if the route allows it
   *
   * @example
   * const url = new SafeURL('/foo/bar#*', { baseUrl: 'https://...' });
   *
   * url.setHash('baz');
   *
   * expect(url.getHash()).toBe('#baz'); // true
   *
   * @example
   * const url1 = new SafeURL('/foo/bar#', { baseUrl: 'https://...' });
   * const url2 = new SafeURL('/foo/bar#static-hash', { baseUrl: 'https://...' });
   *
   * url1.setHash('baz'); // Error: Hash value is not mutable
   * url2.setHash('baz'); // Error: Hash value is not mutable
   *
   * expect(url1.getHash()).toBe(''); // true
   * expect(url2.getHash()).toBe('#static-hash'); // true
   *
   * @example
   * const url = new SafeURL('/foo/bar', { baseUrl: 'https://...' });
   *
   * url.setHash('baz'); // Error: Route does not allow hash property
   *
   * expect(url.getHash()).toBe(''); // true
   *
   * @param hash - URL hash value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/hash))
   */
  setHash(hash: string): void {
    if (HASH_REGEXPS.allowedHash.test(this.route_)) {
      this.url_.hash = hash;
    } else if (HASH_REGEXPS.staticHash.test(this.route_)) {
      throw new URLError('Hash value is not mutable');
    } else {
      throw new URLError('Route does not allow hash property');
    }
  }

  /**
   * @returns URL hash value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/hash))
   */
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
