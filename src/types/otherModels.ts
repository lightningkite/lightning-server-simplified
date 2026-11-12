import { Condition } from "../Condition";
import { Modification } from "../Modification";
import { Optic, AnyOptic } from "./Optic";
import { SortPart } from "./SortPart";

/** `T` with every field optional, recursively, as returned by a partial query. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** A request for the items of type `T` that match {@link condition}, sorted and paged. */
export interface Query<T> {
  /** Defaults to `{ Always: true }`. */
  condition?: Condition<T>;
  /** Defaults to no sort, which leaves the order up to the database. */
  orderBy?: Array<SortPart<T>>;
  /** The number of matching items to leave out before the first one returned. Defaults to `0`. */
  skip?: number;
  /** The most items to return. Defaults to `100`. */
  limit?: number;
}

/**
 * A {@link Query} that returns only the given {@link fields} of each item.
 *
 * The server always adds `_id` to the fields.
 */
export interface QueryPartial<T> {
  /** The paths to include. The server treats the list as a set. */
  fields: Array<AnyOptic<T>>;
  /** Defaults to `{ Always: true }`. */
  condition?: Condition<T>;
  /** Defaults to no sort, which leaves the order up to the database. */
  orderBy?: Array<SortPart<T>>;
  /** The number of matching items to leave out before the first one returned. Defaults to `0`. */
  skip?: number;
  /** The most items to return. Defaults to `100`. */
  limit?: number;
}

/** Applies {@link modification} to every item that matches {@link condition}. */
export interface MassModification<T> {
  condition: Condition<T>;
  modification: Modification<T>;
}
/** One item before and after a change; `old` is missing for an insert and `new` for a delete. */
export interface EntryChange<T> {
  old?: T | null;
  new?: T | null;
}
/** An update to a live list: either the whole list, or one item before and after a change, like {@link EntryChange}. */
export interface ListChange<T> {
  wholeList?: Array<T> | null;
  old?: T | null;
  new?: T | null;
}
/** Counts the items that match {@link condition}, separately for each value of {@link groupBy}. */
export interface GroupCountQuery<Model> {
  /** Defaults to `{ Always: true }`. */
  condition?: Condition<Model>;
  groupBy: AnyOptic<Model>;
}

/** Computes {@link aggregate} over {@link property} of the items that match {@link condition}. */
export interface AggregateQuery<Model> {
  aggregate: Aggregate;
  /** Defaults to `{ Always: true }`. */
  condition?: Condition<Model>;
  property: Optic<Model, number | null | undefined>;
}

/** An {@link AggregateQuery} computed separately for each value of {@link groupBy}. */
export interface GroupAggregateQuery<Model> {
  aggregate: Aggregate;
  /** Defaults to `{ Always: true }`. */
  condition?: Condition<Model>;
  groupBy: AnyOptic<Model>;
  property: Optic<Model, number | null | undefined>;
}

/** A statistic over a numeric field. Items whose field is `null` are left out. */
export type Aggregate =
  | "Sum"
  | "Average"
  | "StandardDeviationSample"
  | "StandardDeviationPopulation";
