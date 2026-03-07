import { DataClassPathPartial } from "./DataClassPath";

/**
 * SortPart can be a simple field path (e.g., "name"), or prefixed with "-" for descending (e.g., "-age"), "\~" for case-insensitive (e.g., "\~username"), or both (e.g., "-~createdAt").
 */
export type SortPart<T> = `${"" | "-" | "~" | "-~"}${DataClassPathPartial<T>}`;
