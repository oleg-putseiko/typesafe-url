import { describe, expect, test } from '@jest/globals';
import { SafeURL } from '../safe-url';

describe('Safe URL', () => {
  test('build url', () => {
    expect(() => new SafeURL('/foo/bar')).toThrow('Invalid URL');

    expect(
      () => new SafeURL('/foo/bar', { baseUrl: 'https://baz.com' }),
    ).not.toThrow();
    expect(() => new SafeURL('https://baz.com/foo/bar')).not.toThrow();
  });
});
