function undefinedToNull<T>(value: T): T extends undefined ? null : T {
  if (value === undefined) {
    return null as any;
  }
  if (Array.isArray(value)) {
    return value.map(v => undefinedToNull(v)) as any;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, undefinedToNull(v)])
    ) as any;
  }
  return value as any;
}

type RequiredByKeys<T, K extends keyof T> =
  Omit<T, K> & { [P in K]-?: T[P] };


export { undefinedToNull };
export type { RequiredByKeys };
