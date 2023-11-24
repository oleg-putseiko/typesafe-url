import { describe, expect, test } from '@jest/globals';

import { SafeURL } from '../safe-url';

type HashTestItem = {
  route: string;
  testHash: string;
  expectedHash: string;
};

describe('Safe URL', () => {
  test('build url', () => {
    expect(() => new SafeURL('/foo/bar')).toThrow('Invalid URL');

    expect(
      () => new SafeURL('/foo/bar', { baseUrl: 'https://qwe.com' }),
    ).not.toThrow();
    expect(() => new SafeURL('https://qwe.com/foo/bar')).not.toThrow();
  });

  describe('set hash', () => {
    test('disallowed', () => {
      const testItems: HashTestItem[] = [
        {
          route: 'https://qwe.com/foo/bar',
          testHash: 'qwe',
          expectedHash: '',
        },
        {
          route: 'https://qwe.com/foo/bar?baz=qux&quux=quuux',
          testHash: 'qwe',
          expectedHash: '',
        },
      ];

      testItems.forEach(({ route, testHash, expectedHash }) => {
        const url = new SafeURL(route);

        expect(() => {
          url.setHash(testHash as never);
        }).toThrow('Route does not allow hash property');

        expect(url.getHash()).toBe(expectedHash);
      });
    });

    test('static', () => {
      const testItems: HashTestItem[] = [
        {
          route: 'https://qwe.com/foo/bar#',
          testHash: 'qwe',
          expectedHash: '',
        },
        {
          route: 'https://qwe.com/foo/bar#baz',
          testHash: 'qwe',
          expectedHash: '#baz',
        },
        {
          route: 'https://qwe.com/foo/bar?baz=qux&quux=quuux#',
          testHash: 'qwe',
          expectedHash: '',
        },
        {
          route: 'https://qwe.com/foo/bar?baz=qux&quux=quuux#baz',
          testHash: 'qwe',
          expectedHash: '#baz',
        },
      ];

      testItems.forEach(({ route, testHash, expectedHash }) => {
        const url = new SafeURL(route);

        expect(() => {
          url.setHash(testHash as never);
        }).toThrow('Hash value is not mutable');

        expect(url.getHash()).toBe(expectedHash);
      });
    });

    test('allowed', () => {
      const testItems: HashTestItem[] = [
        {
          route: 'https://qwe.com/foo/bar#*',
          testHash: 'qwe',
          expectedHash: '#qwe',
        },
        {
          route: 'https://qwe.com/foo/bar?baz=qux&quux=quuux#*',
          testHash: 'qwe',
          expectedHash: '#qwe',
        },
      ];

      testItems.forEach(({ route, testHash, expectedHash }) => {
        const url = new SafeURL(route);

        expect(() => {
          url.setHash(testHash as never);
        }).not.toThrow();

        expect(url.getHash()).toBe(expectedHash);
      });
    });

    test('certain', () => {
      const successTestItems: HashTestItem[] = [
        {
          route: 'https://qwe.com/foo/bar#<baz>',
          testHash: 'baz',
          expectedHash: '#baz',
        },
        {
          route: 'https://qwe.com/foo/bar#<baz|qux|quux>',
          testHash: 'qux',
          expectedHash: '#qux',
        },
        {
          route: 'https://qwe.com/foo/bar?baz=qux&quux=quuux#<baz>',
          testHash: 'baz',
          expectedHash: '#baz',
        },
        {
          route: 'https://qwe.com/foo/bar?baz=qux&quux=quuux#<baz|qux|quux>',
          testHash: 'qux',
          expectedHash: '#qux',
        },
      ];

      const failTestItems: HashTestItem[] = [
        {
          route: 'https://qwe.com/foo/bar#<>',
          testHash: 'qwe',
          expectedHash: '',
        },
        {
          route: 'https://qwe.com/foo/bar?baz=qux&quux=quuux#<>',
          testHash: 'qwe',
          expectedHash: '',
        },
        {
          route: 'https://qwe.com/foo/bar#<baz>',
          testHash: 'qwe',
          expectedHash: '',
        },
        {
          route: 'https://qwe.com/foo/bar?baz=qux&quux=quuux#<quuuux>',
          testHash: 'qwe',
          expectedHash: '',
        },
      ];

      successTestItems.forEach(({ route, testHash, expectedHash }) => {
        const url = new SafeURL(route);

        expect(() => {
          url.setHash(testHash as never);
        }).not.toThrow();

        expect(url.getHash()).toBe(expectedHash);
      });

      failTestItems.forEach(({ route, testHash, expectedHash }) => {
        const url = new SafeURL(route);

        expect(() => {
          url.setHash(testHash as never);
        }).toThrow('Hash value does not match to certain ones');

        expect(url.getHash()).toBe(expectedHash);
      });
    });
  });
});
