export const keys = <T extends AnyObject, K extends keyof T = keyof T>(
  obj: T,
) => Object.keys(obj) as K[];
