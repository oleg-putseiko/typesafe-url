import { type ILogger, Logger, type LogLevel } from './logger';
import { freezeProperty, keys } from './object';

type Strict<S extends boolean, T, D> = S extends true ? T : D;

type RouteTemplateValue = string | number;
type SafeString<T extends string> = T extends '' ? never : T;

type CertainHash<H extends string> = H extends `${infer C}|`
  ? C
  : H extends `|${infer C}`
    ? C
    : H extends `${infer C}|${infer R}`
      ? C | CertainHash<R>
      : H;
type Hash<R extends string> = R extends `${infer _}#*`
  ? string
  : R extends `${infer _}#<${infer C}>`
    ? CertainHash<C>
    : never;
type SegmentKeys<R extends string> =
  R extends `${infer _}/:${infer S}/${infer R}`
    ? SafeString<S> | SegmentKeys<`/${R}`>
    : R extends `${infer _}/:${infer S}?${infer _}`
      ? SafeString<S>
      : R extends `${infer _}/:${infer S}`
        ? SafeString<S>
        : never;

type Segments<
  R extends string,
  K extends SegmentKeys<R> = SegmentKeys<R>,
> = K extends never ? never : Record<K, RouteTemplateValue>;
type AnySegments = Record<string, RouteTemplateValue>;

type Credentials = {
  username: string;
  password: string;
};

type URLOptions<S extends boolean = true> = {
  baseUrl: string;
  logger: ILogger;
  logLevel: LogLevel | LogLevel[];
  isStrictModeEnabled: S;
};

const NODE_ENV = process.env.NODE_ENV;
const IS_DEVELOPMENT = !NODE_ENV || NODE_ENV === 'development';

const SEGMENT_REGEXPS = {
  keys: /\/:([^\\?#\\/]+)($|\?|#|\/)/gu,
};

const HASH_REGEXPS = {
  anyHash: /#\*$/u,
  certainHash: /#<(.*)>$/u,
  staticHash: /#[^\\*].*$/u,
};

const areCredentialsValid = (username: string, password: string) =>
  (username !== '' && password !== '') || (username === '' && password === '');

export class SafeURL<R extends string, S extends boolean = true> {
  private readonly url_: URL;
  private segments_: Partial<Segments<R>> = {};
  private segmentKeys_: SegmentKeys<R>[] = [];

  protected readonly route_: R;
  protected logger_: Logger;
  protected readonly isStrictModeEnabled_: S;

  constructor(route: R, options?: Some<URLOptions<S>>) {
    this.url_ = new URL(route, options?.baseUrl);
    this.route_ = route;
    this.isStrictModeEnabled_ = options?.isStrictModeEnabled ?? (true as S);

    this.logger_ = new Logger({
      instance: options?.logger,
      scope: 'Safe URL',
      level: options?.logLevel,
      isEnabled: IS_DEVELOPMENT,
    });

    if (!this.isStrictModeEnabled_) {
      this.logger_.warn(`Strict mode for route "${this.route_}" is disabled`);
    }

    if (!areCredentialsValid(this.url_.username, this.url_.password)) {
      this.throw_(new Error('Invalid credentials'));
    }

    this.segmentKeys_ = [...this.route_.matchAll(SEGMENT_REGEXPS.keys)].reduce<
      SegmentKeys<R>[]
    >((keys, matches) => {
      if (matches.length > 1) keys.push(matches[1] as SegmentKeys<R>);
      return keys;
    }, []);

    if (this.segmentKeys_.length <= 0) {
      freezeProperty(this.url_, 'pathname');
      this.logger_.info(
        `URL pathname value of the route "${this.route_}" is frozen`,
      );
    }

    if (!HASH_REGEXPS.staticHash.test(this.route_)) {
      this.url_.hash = '';
    }

    if (
      !HASH_REGEXPS.anyHash.test(this.route_) &&
      !HASH_REGEXPS.certainHash.test(this.route_)
    ) {
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
   * const url = new SafeURL('/foo/bar', { baseUrl: 'https://...' });
   *
   * url.setHash('baz'); // TypeError: Route does not allow hash property
   *
   * expect(url.getHash()).toBe(''); // true
   *
   * @example
   * const url = new SafeURL('/foo/bar#*', { baseUrl: 'https://...' });
   *
   * url.setHash('qwe');
   *
   * expect(url.getHash()).toBe('#qwe'); // true
   *
   * @example
   * const url = new SafeURL('/foo/bar#baz', { baseUrl: 'https://...' });
   *
   * url.setHash('qwe'); // TypeError: Hash value is not mutable
   *
   * expect(url.getHash()).toBe('#baz'); // true
   *
   * @example
   * const url = new SafeURL('/foo/bar#<baz|qux|quux>', { baseUrl: 'https://...' });
   *
   * url.setHash('qwe'); // TypeError: Hash value does not match to certain ones
   *
   * expect(url.getHash()).toBe(''); // true
   *
   * url.setHash('qux');
   *
   * expect(url.getHash()).toBe('#qux'); // true
   *
   * @param hash - URL hash value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/hash))
   */
  setHash(hash: Strict<S, Hash<R>, string>): void {
    if (HASH_REGEXPS.anyHash.test(this.route_)) {
      this.url_.hash = hash;
      return;
    }

    if (HASH_REGEXPS.certainHash.test(this.route_)) {
      const certainValues =
        this.route_.match(HASH_REGEXPS.certainHash)?.[1]?.split('|') ?? [];

      if (!certainValues.includes(hash)) {
        this.throw_(new TypeError('Hash value does not match to certain ones'));
        return;
      }

      this.url_.hash = hash;
      return;
    }

    if (HASH_REGEXPS.staticHash.test(this.route_)) {
      this.throw_(new TypeError('Hash value is not mutable'));
      return;
    }
    this.throw_(new TypeError('Route does not allow hash property'));
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
    this.logUnsafeUsage_();
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

  /**
   * @returns URL pathname value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/pathname))
   */
  getPathname() {
    this.logUnsafeUsage_();
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
   * Sets an URL segment values if the route allows it
   *
   * @example
   * const url = new SafeURL('/foo/:bar/baz', { baseUrl: 'https://...' });
   *
   * url.setSegments({ bar: 'qwe' });
   *
   * expect(url.getPathname()).toBe('/foo/qwe/baz'); // true
   *
   * @example
   * const url = new SafeURL('/foo/:bar/baz', { baseUrl: 'https://...' });
   *
   * url.setSegments({ qux: 'qwe' }); // TypeError: Segment key does not match to certain ones
   *
   * expect(url.getPathname()).toBe('/foo/:baz/baz'); // true
   *
   * @example
   * const url = new SafeURL('/foo/bar/baz', { baseUrl: 'https://...' });
   *
   * url.setSegments({ qux: 'qwe' }); // TypeError: Route does not allow segment properties
   *
   * expect(url.getPathname()).toBe('/foo/baz/baz'); // true
   *
   * @param segments - URL segment values ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/pathname))
   */
  setSegments(segments: Strict<S, Segments<R>, AnySegments>): void {
    if (this.segmentKeys_.length <= 0) {
      this.throw_(new TypeError('Route does not allow segment properties'));
      return;
    }

    if (!this.areSegmentsValid_(segments)) {
      this.throw_(new TypeError('Segment key does not match to certain ones'));
      return;
    }

    this.segments_ = { ...this.segments_, ...segments };

    this.url_.pathname = keys(this.segments_)
      .reduce<string>(
        (pathname, key) =>
          pathname.replace(
            RegExp(`/(:${String(key)})(/|#|\\?|$)`, 'u'),
            `/${segments[key]}$2`,
          ),
        this.route_,
      )
      .replace(/(?<=\/[^#\\?]*)((#|\?).*$)/u, '');
  }

  /**
   * @returns URL segment values ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/pathname))
   */
  getSegments(): Partial<Segments<R>> {
    return this.segments_;
  }

  /**
   * @returns URL username value ([MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/username))
   */
  getUsername(): string {
    return this.url_.username;
  }

  /**
   * Throws an error if strict mode is enabled and displays it as a warning if strict mode is disabled
   *
   * @param error - An `Error` instance
   */
  protected throw_(error: Error): void {
    if (this.isStrictModeEnabled_) throw error;
    else this.logger_.traceWarn(error.message);
  }

  private logUnsafeUsage_(): void {
    const countOfUnusedSegments =
      [...this.route_.matchAll(SEGMENT_REGEXPS.keys)].filter(
        (matches) => matches.length > 1,
      ).length - keys(this.segments_).length;

    if (countOfUnusedSegments > 0) {
      this.logger_.traceWarn(
        'Some segment values are not set, using the url is unsafe',
      );
    }
  }

  private areSegmentsValid_(segments: AnySegments): segments is Segments<R> {
    return keys(segments).every((key) =>
      (this.segmentKeys_ satisfies string[] as string[]).includes(key),
    );
  }
}
