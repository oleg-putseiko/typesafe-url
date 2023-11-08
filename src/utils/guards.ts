export const isObject = (value: unknown): value is AnyObject =>
  typeof value === 'object' && value !== null;

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number';

export const isString = (value: unknown): value is string =>
  typeof value === 'string';
