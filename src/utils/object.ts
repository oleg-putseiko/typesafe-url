export const keys = <T extends AnyObject, K extends keyof T = keyof T>(
  obj: T,
) => Object.keys(obj) as K[];

export const freezeProperty = <T extends object>(obj: T, key: keyof T) => {
  if (obj !== null) {
    Object.defineProperty(obj, key, {
      value: obj[key],
      writable: false,
      configurable: false,
    });
  }
};
