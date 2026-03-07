
type FilterByType<T, Paths extends DataClassPathPartial<T>, V> = keyof {
  [P in Paths as PathValue<T, P> extends V ? P : never]: V;
};

export type DataClassPath<T, V> = FilterByType<T, DataClassPathPartial<T>, V>;

export type DataClassPathPartial<T> =
  T extends Array<infer Inner>
    ? `*.${DataClassPathPartial<Inner>}`
    : T extends object
      ? {
          [K in keyof T &
            string]: `${K}${`${NullIndicator<T[K]>}.${DataClassPathPartial<T[K]>}` | ""}`;
        }[keyof T & string]
      : never;

type NullIndicator<T> = [null] extends [T]
  ? "?"
  : [undefined] extends [T]
    ? "?"
    : "";

/**
 * Determines the type of the value at path `P`
 * If any path includes null | undefined, then the end value will be nullable.
 */
export type PathValue<T, P extends DataClassPathPartial<T>> = PathImpl<
  T,
  P,
  false
>;

type PathImpl<
  T,
  P extends DataClassPathPartial<T>,
  Nullable extends boolean,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends DataClassPathPartial<T[K]>
      ? PathImpl<NonNullable<T[K]>, Rest, Nullable>
      : T[K]
    : K extends `${infer K2}?`
      ? K2 extends keyof T
        ? Rest extends DataClassPathPartial<T[K2]>
          ? PathImpl<NonNullable<T[K2]>, Rest, true>
          : T[K2]
        : never
      : ["*"] extends [K]
        ? Unwrap<T, Rest, Nullable>
        : never
  : P extends keyof T
    ? Nullable extends true
      ? T[P] | null | undefined
      : T[P]
    : never;

type Unwrap<T, Rest, Nullable extends boolean> =
  T extends Array<infer U>
    ? Rest extends `${infer Rest1}`
      ? Rest1 extends DataClassPathPartial<U>
        ? PathImpl<U, Rest1, Nullable>
        : never
      : never
    : never;
