import { AnyOptic } from "./Optic";

/**
 * One field of a sort order: an {@link AnyOptic}, prefixed with `-` to sort descending, `~` to ignore case, or both
 * as `-~`.
 *
 * The server sorts `null` before every other value and compares strings by code point, so `"Ab"` sorts before
 * `"aa"` unless `~` is given.
 */
export type SortPart<T> = `${"" | "-" | "~" | "-~"}${AnyOptic<T>}`;
