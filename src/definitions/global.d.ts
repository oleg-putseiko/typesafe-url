declare global {
  type Some<T, Keys extends keyof T = keyof T> = Partial<T> &
    { [K in Keys]: Required<Pick<T, K>> }[Keys];

  type ObjectKey = string | number | symbol;
  type AnyObject = Record<ObjectKey, unknown>;
}

export {};
