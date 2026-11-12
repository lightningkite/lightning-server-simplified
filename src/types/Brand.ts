
declare const __lsBrand: unique symbol

/**
 * A `K` tagged with `T`, so that, for example, a user's ID can't be passed where a post's ID is expected.
 *
 * Brands exist only at compile time; a `Brand<string, "User">` is a plain string at runtime.
 */
export type Brand<K, T> = K & {[__lsBrand]: T}

/** Returns `id` as a {@link Brand}, unchanged at runtime. */
export function asBrandedId<ID, T>(id: ID): Brand<ID, T> {
	return id as Brand<ID, T>
}