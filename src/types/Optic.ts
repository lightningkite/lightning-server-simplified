
type FilterByType<T, Paths extends AnyOptic<T>, V> = keyof {
  [P in Paths as PathValue<T, P> extends V ? P : never]: V;
};

/**
 * A path into `T` whose target is assignable to `V`, serialized the way the server's `Optic<T, V>` is.
 *
 * It is the subset of {@link AnyOptic} whose {@link PathValue} is a `V`. A path through a nullable step may find
 * nothing, so its value includes `null` and `undefined`, and it is only an `Optic<T, V>` when `V` does too:
 *
 * ```ts
 * type User = { name: string; address: { city: string; zip: number } | null };
 *
 * const name: Optic<User, string> = "name";
 * const zip: Optic<User, number | null | undefined> = "address?.zip";
 * ```
 *
 * The server's `Optic<User, Int>` would accept `"address?.zip"`, since its `get` returns `null` when the target is
 * missing.
 */
export type Optic<T, V> = FilterByType<T, AnyOptic<T>, V>;

/**
 * A path to any part of `T`, serialized the way the server's `AnyOptic<T>` is.
 *
 * A path is the names of the fields it passes through, joined with `.`, so `"address.city"` targets the `city` of
 * the `address`. A field whose value may be `null` or `undefined` is followed by `?`, as in `"address?.city"`, and a
 * `*` step targets every element of an array, as in `"pets.*.name"`.
 *
 * The server also accepts `"this"` for the whole value and `<Variant>` steps into sealed types, and lets `?` be left
 * out; this type doesn't generate those forms.
 */
export type AnyOptic<T> =
  T extends Array<infer Inner>
    ? `*.${AnyOptic<Inner>}`
    : T extends object
      ? {
          [K in keyof T &
            string]: `${K}${`${NullIndicator<T[K]>}.${AnyOptic<T[K]>}` | ""}`;
        }[keyof T & string]
      : never;

type NullIndicator<T> = [null] extends [T]
  ? "?"
  : [undefined] extends [T]
    ? "?"
    : "";

/**
 * The type of the target of path `P` within `T`.
 *
 * When `P` passes through a `?` step, the result also includes `null` and `undefined`, since that step may find
 * nothing. A `*` step targets the array's element type.
 */
export type PathValue<T, P extends AnyOptic<T>> = PathImpl<
  T,
  P,
  false
>;

type PathImpl<
  T,
  P extends AnyOptic<T>,
  Nullable extends boolean,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends AnyOptic<T[K]>
      ? PathImpl<NonNullable<T[K]>, Rest, Nullable>
      : T[K]
    : K extends `${infer K2}?`
      ? K2 extends keyof T
        ? Rest extends AnyOptic<T[K2]>
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
      ? Rest1 extends AnyOptic<U>
        ? PathImpl<U, Rest1, Nullable>
        : never
      : never
    : never;

/** @deprecated Renamed to {@link Optic} to match Service Abstractions 1.4. */
export type DataClassPath<T, V> = Optic<T, V>;

/** @deprecated Renamed to {@link AnyOptic} to match Service Abstractions 1.4. */
export type DataClassPathPartial<T> = AnyOptic<T>;
