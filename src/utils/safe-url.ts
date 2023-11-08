import { URLError } from './errors';
import { ILogger, Logger } from './logger';
import { freezeProperty } from './object';

type Strict<S extends boolean, T, D> = S extends true ? T : D;

type Hash<R extends string> = R extends `${infer _}#*` ? string : never;

type Credentials = {
  username: string;
  password: string;
};

type URLOptions<S extends boolean = true> = {
  baseUrl: string;
  logger: ILogger;
  isStrictModeEnabled: S;
};

const NODE_ENV = process.env.NODE_ENV;

const HASH_REGEXPS = {
  allowedHash: /#\*$/,
  staticHash: /#([^\*]?|.{2,})$/,
};

const areCredentialsValid = (username: string, password: string) =>
  (username !== '' && password !== '') || (username === '' && password === '');

export class SafeURL<R extends string, S extends boolean = true> {
  private readonly url_: URL;

  protected readonly route_: R;
  protected logger_: ILogger;
  protected readonly isStrictModeEnabled_: S;

  constructor(route: R, options?: Some<URLOptions<S>>) {
    this.url_ = new URL(route, options?.baseUrl);
    this.route_ = route;
    this.isStrictModeEnabled_ = options?.isStrictModeEnabled ?? (true as S);

    this.logger_ = new Logger({
      instance: options?.logger,
      scope: 'Safe URL',
      isEnabled: !NODE_ENV || NODE_ENV === 'development',
    });

    if (!areCredentialsValid(this.url_.username, this.url_.password)) {
      this.throw_(new Error('Invalid credentials'));
    }

    if (!this.isStrictModeEnabled_) {
      this.logger_.warn(`Strict mode for route "${this.route_}" is disabled`);
    }

    if (!HASH_REGEXPS.allowedHash.test(this.route_)) {
      freezeProperty(this.url_, 'hash');
      this.logger_.info(
        `URL hash value of the route "${this.route_}" is frozen`,
      );
    }
  }

  /**
   * Sets URL username and password values
   *
   * @param credentials
   * * `username` - URL username value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/username))
   * * `password` - URL password value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/password))
   */
  setCredentials(credentials: Credentials): void {
    const { username, password } = credentials;

    if (!areCredentialsValid(username, password)) {
      this.throw_(new Error('Invalid credentials'));
    }

    this.url_.username = username;
    this.url_.password = password;
  }

  /**
   * @returns URL credentials:
   * * `username` - URL username value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/username))
   * * `password` - URL password value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/password))
   */
  getCredentials(): Credentials {
    return { username: this.url_.username, password: this.url_.password };
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
  setHash(hash: Strict<S, Hash<R>, string>): void {
    if (HASH_REGEXPS.allowedHash.test(this.route_)) {
      this.url_.hash = hash;
    } else if (HASH_REGEXPS.staticHash.test(this.route_)) {
      this.throw_(new URLError('Hash value is not mutable'));
    } else {
      this.throw_(new URLError('Route does not allow hash property'));
    }
  }

  /**
   * @returns URL hash value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/hash))
   */
  getHash(): string {
    return this.url_.hash;
  }

  /**
   * Sets an URL host value
   *
   * @param host - URL host value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/host))
   */
  setHost(host: string): void {
    this.url_.host = host;
  }

  /**
   * @returns URL host value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/host))
   */
  getHost(): string {
    return this.url_.host;
  }

  /**
   * Sets an URL hostname value
   *
   * @param hostname - URL hostname value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/hostname))
   */
  setHostname(hostname: string): void {
    this.url_.hostname = hostname;
  }

  /**
   * @returns URL hostname value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/hostname))
   */
  getHostname(): string {
    return this.url_.hostname;
  }

  getHref() {
    return this.url_.href;
  }

  /**
   * @returns URL origin value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/origin))
   */
  getOrigin(): string {
    return this.url_.origin;
  }

  /**
   * @returns URL password value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/password))
   */
  getPassword(): string {
    return this.url_.password;
  }

  getPathname() {
    return this.url_.pathname;
  }

  /**
   * Sets an URL port value
   *
   * @param port - URL port value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/port))
   */
  setPort(port: string): void {
    this.url_.port = port;
  }

  /**
   * @returns URL port value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/port))
   */
  getPort(): string {
    return this.url_.port;
  }

  /**
   * Sets an URL protocol value
   *
   * @param protocol - URL protocol value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/protocol))
   */
  setProtocol(protocol: string): void {
    this.url_.protocol = protocol;
  }

  /**
   * @returns URL protocol value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/protocol))
   */
  getProtocol(): string {
    return this.url_.protocol;
  }

  getSearch() {
    return this.url_.search;
  }

  getSearchParams() {
    return this.url_.searchParams;
  }

  /**
   * @returns URL username value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/username))
   */
  getUsername(): string {
    return this.url_.username;
  }

  private throw_(error: Error) {
    if (this.isStrictModeEnabled_) throw error;
    else this.logger_.warn(error.message);
  }
}
